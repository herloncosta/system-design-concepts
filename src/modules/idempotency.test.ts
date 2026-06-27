import { describe, it, expect, beforeEach } from 'vitest'
import { check, saveResult, removeKey } from './idempotency.js'

const TEST_KEY = 'chave-teste'
const TEST_DATA = { orderId: '123', status: 'PROCESSADO_COM_SUCESSO' }

describe('idempotency', () => {
  beforeEach(() => {
    removeKey(TEST_KEY)
  })

  it('retorna NEW para chave nunca vista', () => {
    const result = check(TEST_KEY)
    expect(result.status).toBe('NEW')
    expect(result.data).toBeNull()
  })

  it('retorna PROCESSING na segunda verificacao da mesma chave', () => {
    check(TEST_KEY)
    const result = check(TEST_KEY)
    expect(result.status).toBe('PROCESSING')
  })

  it('retorna COMPLETED com dados apos saveResult', () => {
    check(TEST_KEY)
    saveResult(TEST_KEY, TEST_DATA)
    const result = check<typeof TEST_DATA>(TEST_KEY)
    expect(result.status).toBe('COMPLETED')
    expect(result.data).toEqual(TEST_DATA)
  })

  it('retorna NEW apos removeKey', () => {
    check(TEST_KEY)
    saveResult(TEST_KEY, TEST_DATA)
    removeKey(TEST_KEY)
    const result = check(TEST_KEY)
    expect(result.status).toBe('NEW')
  })

  it('retorna NEW para chave vazia', () => {
    const result = check('')
    expect(result.status).toBe('NEW')
    expect(result.data).toBeNull()
  })
})
