// On-device MobileFaceNet embedding helpers. The vector is always 192 floats.
//
// Pipeline:
// - Mobile generates a 192-d Float32List per capture.
// - Mobile JSON-stringifies it and sends it in the multipart "faceEmbedding"
//   field for check-in/out, or in JSON body for enrollment.
// - This module parses + cosine-compares.

const EMBEDDING_DIM = 192

export class InvalidEmbeddingError extends Error {
  constructor(reason: string) {
    super(reason)
    this.name = 'InvalidEmbeddingError'
  }
}

/**
 * Parse an arbitrary input (multipart string, parsed JSON array, etc.) into
 * a 192-d float vector. Throws InvalidEmbeddingError on shape / NaN issues.
 */
export function parseEmbedding(raw: unknown): number[] {
  let arr: unknown = raw
  if (typeof raw === 'string') {
    try {
      arr = JSON.parse(raw)
    } catch {
      throw new InvalidEmbeddingError('embedding is not valid JSON')
    }
  }
  if (!Array.isArray(arr)) {
    throw new InvalidEmbeddingError('embedding must be an array')
  }
  if (arr.length !== EMBEDDING_DIM) {
    throw new InvalidEmbeddingError(
      `embedding must have ${EMBEDDING_DIM} dimensions, got ${arr.length}`,
    )
  }
  const out = new Array<number>(EMBEDDING_DIM)
  for (let i = 0; i < EMBEDDING_DIM; i++) {
    const n = arr[i]
    if (typeof n !== 'number' || !Number.isFinite(n)) {
      throw new InvalidEmbeddingError(`embedding[${i}] is not a finite number`)
    }
    out[i] = n
  }
  return out
}

/** Cosine similarity in [-1, 1]. Higher = more similar. */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return -1
  let dot = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  if (normA === 0 || normB === 0) return -1
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

/**
 * Read FACE_SIMILARITY_THRESHOLD from env. Default 0.7 matches MobileFaceNet
 * convention on cleanly captured 112×112 face crops. Values outside [0, 1]
 * fall back to the default.
 */
export function similarityThreshold(): number {
  const raw = process.env.FACE_SIMILARITY_THRESHOLD
  if (!raw) return 0.7
  const n = Number(raw)
  if (!Number.isFinite(n) || n < 0 || n > 1) return 0.7
  return n
}
