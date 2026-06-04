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
 * Push a notification to the single FCM token stored on the user row.
 *
 * Returns 1 on a successful send, 0 otherwise. Failures are swallowed —
 * announcement publish path doesn't get to fail just because Firebase is
 * flaky.
 */
export async function sendToUser(
  userId: string,
  payload: FcmPayload,
): Promise<number> {
  const admin = loadAdmin()
  if (!admin) return 0

  const row = await db
    .selectFrom('user')
    .select(['fcmToken'])
    .where('id', '=', userId)
    .executeTakeFirst()
  const token = row?.fcmToken
  if (!token) return 0

  try {
    const res = await admin.messaging().send({
      token,
      notification: { title: payload.title, body: payload.body },
      data: payload.data,
    })
    return res ? 1 : 0
  } catch (e: any) {
    console.error('[fcm] sendToUser failed', { userId, name: e?.name })
    return 0
  }
}

/**
 * Broadcast to every user that has an FCM token. One row per user, so the
 * token list is bounded by the user count. Batches into chunks of 500 —
 * `sendEachForMulticast`'s per-request limit.
 */
export async function broadcast(payload: FcmPayload): Promise<number> {
  const admin = loadAdmin()
  if (!admin) return 0

  const rows = await db
    .selectFrom('user')
    .select(['fcmToken'])
    .where('fcmToken', 'is not', null)
    .execute()
  const tokens = rows
    .map((r) => r.fcmToken)
    .filter((t): t is string => typeof t === 'string' && t.length > 0)
  if (tokens.length === 0) return 0

  let total = 0
  const messaging = admin.messaging()
  const chunkSize = 500
  for (let i = 0; i < tokens.length; i += chunkSize) {
    const slice = tokens.slice(i, i + chunkSize)
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
