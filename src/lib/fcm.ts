/**
 * Thin wrapper around firebase-admin's messaging API.
 *
 * Config: set `FIREBASE_SA_JSON_BASE64` to the base64 encoding of the
 * Firebase service-account JSON (Settings → Service accounts → "Generate
 * new private key" → `base64 < file.json | tr -d '\n'`). When the env var
 * is absent we no-op — useful for local dev and unit tests.
 *
 * Callers MUST treat `sendToUser` as best-effort: failures are logged but
 * never thrown, so a flaky FCM project can't take a request handler down.
 */
import { db } from './database'

type AdminModule = typeof import('firebase-admin')
let cached: AdminModule | null = null
let initFailed = false

function loadAdmin(): AdminModule | null {
  if (initFailed) return null
  if (cached) return cached

  const b64 = process.env.FIREBASE_SA_JSON_BASE64
  if (!b64) {
    initFailed = true
    return null
  }

  try {
    // CommonJS interop — firebase-admin ships dual-format, but the default
    // import path under Node ESM is the namespace.
    const admin = require('firebase-admin') as AdminModule
    if (admin.apps.length === 0) {
      const json = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'))
      admin.initializeApp({
        credential: admin.credential.cert(json),
      })
    }
    cached = admin
    return admin
  } catch (e: any) {
    console.error('[fcm] init failed', { name: e?.name, message: e?.message })
    initFailed = true
    return null
  }
}

export interface FcmPayload {
  title: string
  body: string
  data?: Record<string, string>
}

/**
 * Push a notification to every device the user has registered.
 *
 * Returns the number of successful sends. Failures are swallowed; partial
 * delivery is the norm (stale tokens get pruned by Firebase server-side).
 */
export async function sendToUser(
  userId: string,
  payload: FcmPayload,
): Promise<number> {
  const admin = loadAdmin()
  if (!admin) return 0

  const tokens = await db
    .selectFrom('user_devices')
    .select(['fcmToken'])
    .where('userId', '=', userId)
    .execute()
  if (tokens.length === 0) return 0

  try {
    const res = await admin.messaging().sendEachForMulticast({
      tokens: tokens.map((t) => t.fcmToken),
      notification: { title: payload.title, body: payload.body },
      data: payload.data,
    })
    return res.successCount
  } catch (e: any) {
    console.error('[fcm] sendToUser failed', { userId, name: e?.name })
    return 0
  }
}

/**
 * Broadcast a notification to every registered device.
 *
 * Used by announcement creation. Batches into chunks of 500 because that's
 * `sendEachForMulticast`'s limit per request.
 */
export async function broadcast(payload: FcmPayload): Promise<number> {
  const admin = loadAdmin()
  if (!admin) return 0

  const tokens = await db
    .selectFrom('user_devices')
    .select(['fcmToken'])
    .execute()
  if (tokens.length === 0) return 0

  let total = 0
  const messaging = admin.messaging()
  const chunkSize = 500
  for (let i = 0; i < tokens.length; i += chunkSize) {
    const slice = tokens.slice(i, i + chunkSize).map((t) => t.fcmToken)
    try {
      const res = await messaging.sendEachForMulticast({
        tokens: slice,
        notification: { title: payload.title, body: payload.body },
        data: payload.data,
      })
      total += res.successCount
    } catch (e: any) {
      console.error('[fcm] broadcast chunk failed', { name: e?.name })
    }
  }
  return total
}
