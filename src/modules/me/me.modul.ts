import sharp from 'sharp'
import { MeRepository } from './me.repository'
import { enrollFaceSchema, updateMeSchema, registerDeviceSchema } from './me.schema'
import { deleteFromR2, r2KeyFromPublicUrl, uploadToR2 } from '../../lib/s3'

const ALLOWED_IMAGE_MIME = new Set(['image/jpeg', 'image/png'])
const MAX_AVATAR_BYTES = 5 * 1024 * 1024 // 5MB

// Sniff first bytes to verify the file is actually JPEG/PNG.
function sniffImageMime(buf: Buffer): 'image/jpeg' | 'image/png' | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return 'image/jpeg'
  }
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return 'image/png'
  }
  return null
}

export class MeModule {
  private repository = new MeRepository()

  async processUpdate(userId: string, body: any) {
    const validated = updateMeSchema.safeParse(body)
    if (!validated.success) {
      return {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid data',
          details: validated.error.flatten(),
        },
        status: 422,
      }
    }

    // Reject empty payload — nothing to update.
    if (
      validated.data.name === undefined &&
      validated.data.department === undefined
    ) {
      return {
        error: { code: 'EMPTY_PAYLOAD', message: 'No fields to update' },
        status: 422,
      }
    }

    const data = await this.repository.updateProfile(userId, validated.data)
    if (!data) {
      return { error: { code: 'USER_NOT_FOUND', message: 'User not found' }, status: 404 }
    }

    return { data, status: 200 }
  }

  async processAvatarUpload(userId: string, body: any) {
    const photo = body['photo'] as File | undefined
    if (!photo || typeof (photo as any).arrayBuffer !== 'function') {
      return {
        error: { code: 'MISSING_PHOTO', message: 'photo field is required' },
        status: 422,
      }
    }

    // Declared content-type guard
    const declaredType = (photo as any).type as string | undefined
    if (declaredType && !ALLOWED_IMAGE_MIME.has(declaredType)) {
      return {
        error: {
          code: 'INVALID_MIME_TYPE',
          message: 'Only image/jpeg and image/png are allowed',
        },
        status: 422,
      }
    }

    // Size guard
    const size = (photo as any).size as number | undefined
    if (typeof size === 'number' && size > MAX_AVATAR_BYTES) {
      return {
        error: { code: 'FILE_TOO_LARGE', message: 'Max file size is 5MB' },
        status: 422,
      }
    }

    const arrayBuf = await photo.arrayBuffer()
    const buf = Buffer.from(arrayBuf)

    if (buf.byteLength > MAX_AVATAR_BYTES) {
      return {
        error: { code: 'FILE_TOO_LARGE', message: 'Max file size is 5MB' },
        status: 422,
      }
    }

    const sniffed = sniffImageMime(buf)
    if (!sniffed) {
      return {
        error: {
          code: 'INVALID_IMAGE',
          message: 'File is not a valid JPEG or PNG image',
        },
        status: 422,
      }
    }

    // Capture the previous avatar URL BEFORE we overwrite it so we can clean
    // it up after the new upload + DB update succeed. Failure to delete the
    // old object is non-fatal (best-effort).
    const previous = await this.repository.findById(userId)
    const previousImageUrl = previous?.image as string | null | undefined

    // Re-encode through sharp into a CLEAN BASELINE JPEG (1024x1024 cover,
    // q85, 4:2:0 chroma). Critical bits:
    // - progressive:false → output starts with SOF0 (baseline), not SOF2.
    //   Android's ImageDecoder on Xiaomi / MediaTek bombs with
    //   "unimplemented" on progressive JPEGs (SOF2) even though browsers
    //   and Skia handle them fine. mozjpeg defaults to progressive, so we
    //   explicitly turn that off here as well.
    // - chromaSubsampling 4:2:0 is the universally supported variant.
    const normalized = await sharp(buf)
      .rotate() // honor EXIF orientation before stripping
      .resize(1024, 1024, { fit: 'cover', position: 'centre' })
      .jpeg({
        quality: 85,
        mozjpeg: false,
        progressive: false,
        chromaSubsampling: '4:2:0',
      })
      .toBuffer()

    const key = `avatars/${userId}-${crypto.randomUUID()}.jpg`
    const imageUrl = await uploadToR2(normalized, key, 'image/jpeg')

    const updated = await this.repository.updateImage(userId, imageUrl)
    if (!updated) {
      return { error: { code: 'USER_NOT_FOUND', message: 'User not found' }, status: 404 }
    }

    // Clean up the previous R2 object. Only delete if it lived under our
    // public bucket (skip Google avatars or external URLs).
    if (previousImageUrl && previousImageUrl !== imageUrl) {
      const previousKey = r2KeyFromPublicUrl(previousImageUrl)
      if (previousKey) {
        // Fire-and-forget; do not await so the response time stays low.
        void deleteFromR2(previousKey)
      }
    }

    return { data: { imageUrl }, status: 200 }
  }

  async processFaceEnrollment(userId: string, body: any) {
    const validated = enrollFaceSchema.safeParse(body)
    if (!validated.success) {
      return {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid embedding',
          details: validated.error.flatten(),
        },
        status: 422,
      }
    }

    const updated = await this.repository.updateFaceEmbedding(
      userId,
      JSON.stringify(validated.data.embedding),
    )
    if (!updated) {
      return { error: { code: 'USER_NOT_FOUND', message: 'User not found' }, status: 404 }
    }

    return {
      data: { faceRecognitionEnabled: true },
      status: 200,
    }
  }

  async processRegisterDevice(userId: string, body: any) {
    const validated = registerDeviceSchema.safeParse(body)
    if (!validated.success) {
      return {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid device payload',
          details: validated.error.flatten(),
        },
        status: 422,
      }
    }
    const data = await this.repository.setFcmToken(
      userId,
      validated.data.fcmToken,
    )
    return { data, status: 200 }
  }
}
