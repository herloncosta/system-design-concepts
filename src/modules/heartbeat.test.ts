import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest'
import { getHealth } from './heartbeat.js'

const RealDate = Date.now

describe('heartbeat', () => {
  afterAll(() => {
    vi.restoreAllMocks()
  })

  it('retorna UP quando o heartbeat esta atualizado', () => {
    const result = getHealth()
    expect(result.status).toBe('UP')
    expect(result.lastBeat).toEqual(expect.any(String))
  })

  it('retorna DOWN quando o heartbeat esta expirado', () => {
    vi.spyOn(Date, 'now').mockReturnValue(RealDate() + 20000)
    const result = getHealth()
    expect(result.status).toBe('DOWN')
    vi.restoreAllMocks()
  })

  it('retorna ISO timestamp no lastBeat', () => {
    const result = getHealth()
    expect(() => new Date(result.lastBeat)).not.toThrow()
    expect(result.lastBeat).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })
})
