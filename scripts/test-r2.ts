/**
 * Quick R2 connectivity check. Runs `PutObject` against the bucket using
 * the same envs the API uses. Output tells you immediately whether the
 * credentials + endpoint + bucket triplet is good.
 *
 * Usage: bun scripts/test-r2.ts
 */
import { uploadToR2 } from '../src/lib/s3'

async function main() {
  console.log('Env preview:')
  console.log('  R2_ENDPOINT      =', process.env.R2_ENDPOINT)
  console.log('  R2_BUCKET_NAME   =', process.env.R2_BUCKET_NAME)
  console.log('  R2_PUBLIC_URL    =', process.env.R2_PUBLIC_URL)
  console.log('  R2_ACCESS_KEY_ID =', (process.env.R2_ACCESS_KEY_ID ?? '').slice(0, 6) + '...')
  console.log('')

  const payload = Buffer.from('hello-from-test-r2\n')
  const key = `tests/ping-${Date.now()}.txt`

  try {
    const url = await uploadToR2(payload, key, 'text/plain')
    console.log('✅ Upload OK')
    console.log('   key =', key)
    console.log('   url =', url)
  } catch (e: any) {
    console.error('❌ Upload FAILED')
    console.error('   name              =', e?.name)
    console.error('   code              =', e?.code)
    console.error('   httpStatus        =', e?.$metadata?.httpStatusCode)
    console.error('   fault             =', e?.$fault)
    console.error('   message           =', e?.message)
    process.exit(1)
  }
}

main()
