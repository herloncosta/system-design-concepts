import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { queue, type QueueMessage } from './queue.js'
import { processMessage } from './worker.js'

function makeMessage(): QueueMessage {
  return {
    id: 'msg-test',
    idempotencyKey: 'key-test',
    payload: { item: 'test' },
    createdAt: new Date(),
  }
}

describe('worker', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    queue.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('processa mensagem com sucesso na primeira tentativa', async () => {
    const process = vi.fn().mockResolvedValue({ transactionId: 'TXN-123', status: 'SUCCESS' })
    await processMessage(makeMessage(), process)
    expect(process).toHaveBeenCalledTimes(1)
    expect(queue.getDlq()).toHaveLength(0)
  })

  it('retenta com backoff exponencial apos falha e recupera', async () => {
    const process = vi.fn()
      .mockRejectedValueOnce(new Error('Falha 1'))
      .mockRejectedValueOnce(new Error('Falha 2'))
      .mockResolvedValue({ transactionId: 'TXN-456', status: 'SUCCESS' })

    const promise = processMessage(makeMessage(), process)
    await vi.advanceTimersByTimeAsync(10_000)
    await promise

    expect(process).toHaveBeenCalledTimes(3)
    expect(queue.getDlq()).toHaveLength(0)
  })

  it('move para DLQ apos esgotar todas as tentativas', async () => {
    const process = vi.fn().mockRejectedValue(new Error('Falha permanente'))

    const promise = processMessage(makeMessage(), process)
    await vi.advanceTimersByTimeAsync(10_000)
    await promise

    expect(process).toHaveBeenCalledTimes(3)
    expect(queue.getDlq()).toHaveLength(1)
    expect(queue.getDlq()[0].reason).toContain('Esgotadas')
  })

  it('move para DLQ apenas a mensagem que falhou', async () => {
    const goodProcess = vi.fn().mockResolvedValue({ transactionId: 'TXN-789', status: 'SUCCESS' })
    const badProcess = vi.fn().mockRejectedValue(new Error('Falha permanente'))

    await processMessage(makeMessage(), goodProcess)

    const promise = processMessage(makeMessage(), badProcess)
    await vi.advanceTimersByTimeAsync(10_000)
    await promise

    expect(queue.getDlq()).toHaveLength(1)
    expect(queue.getDlq()[0].originalMessage.id).toBe('msg-test')
  })
})
