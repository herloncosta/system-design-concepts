import { describe, it, expect, beforeEach } from 'vitest'
import { queue, type QueueMessage } from './queue.js'

function makeMessage(overrides?: Partial<QueueMessage>): QueueMessage {
  return {
    id: 'msg-1',
    idempotencyKey: 'key-1',
    payload: { item: 'test' },
    createdAt: new Date(),
    ...overrides,
  }
}

describe('MessageQueue', () => {
  beforeEach(() => {
    queue.clear()
  })

  it('inicia vazia', () => {
    expect(queue.size).toBe(0)
  })

  it('enfileira uma mensagem', () => {
    queue.enqueue(makeMessage())
    expect(queue.size).toBe(1)
  })

  it('desenfileira uma mensagem na ordem correta (FIFO)', () => {
    const first = makeMessage({ id: 'msg-1', idempotencyKey: 'key-a' })
    const second = makeMessage({ id: 'msg-2', idempotencyKey: 'key-b' })
    queue.enqueue(first)
    queue.enqueue(second)

    expect(queue.dequeue()).toEqual(first)
    expect(queue.dequeue()).toEqual(second)
    expect(queue.size).toBe(0)
  })

  it('retorna undefined ao desenfileirar fila vazia', () => {
    expect(queue.dequeue()).toBeUndefined()
  })

  it('move mensagem para DLQ apos falhas', () => {
    const message = makeMessage()
    queue.enqueue(message)
    const msg = queue.dequeue()!

    queue.moveToDlq(msg, 'Erro de teste')
    const dlq = queue.getDlq()

    expect(dlq).toHaveLength(1)
    expect(dlq[0].originalMessage).toEqual(message)
    expect(dlq[0].reason).toBe('Erro de teste')
    expect(dlq[0].failedAt).toBeInstanceOf(Date)
  })

  it('acumula multiplas mensagens na DLQ', () => {
    queue.moveToDlq(makeMessage({ id: 'msg-1' }), 'Erro 1')
    queue.moveToDlq(makeMessage({ id: 'msg-2' }), 'Erro 2')
    expect(queue.getDlq()).toHaveLength(2)
  })

  it('clear esvazia fila principal e DLQ', () => {
    queue.enqueue(makeMessage())
    queue.moveToDlq(makeMessage(), 'Erro')
    queue.clear()
    expect(queue.size).toBe(0)
    expect(queue.getDlq()).toHaveLength(0)
  })
})
