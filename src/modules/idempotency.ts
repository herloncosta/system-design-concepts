type IdempotencyStatus = 'NEW' | 'PROCESSING' | 'COMPLETED'

interface IdempotencyRecord<T = unknown> {
  status: IdempotencyStatus
  data: T | null
}

const store = new Map<string, IdempotencyRecord>()

export function check<T = unknown>(key: string): IdempotencyRecord<T> {
  if (!key) return { status: 'NEW', data: null }

  const existing = store.get(key) as IdempotencyRecord<T> | undefined
  if (existing) return existing

  store.set(key, { status: 'PROCESSING', data: null })
  return { status: 'NEW', data: null }
}

export function saveResult<T>(key: string, data: T): void {
  if (key) store.set(key, { status: 'COMPLETED', data })
}

export function removeKey(key: string): void {
  if (key) store.delete(key)
}
