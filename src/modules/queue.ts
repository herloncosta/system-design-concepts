export interface QueueMessage {
  id: string
  idempotencyKey: string
  payload: unknown
  createdAt: Date
}

export interface DeadLetterMessage {
  originalMessage: QueueMessage
  failedAt: Date
  reason: string
}

class MessageQueue {
  private main: QueueMessage[] = []
  private dlq: DeadLetterMessage[] = []

  enqueue(message: QueueMessage): void {
    this.main.push(message)
  }

  dequeue(): QueueMessage | undefined {
    return this.main.shift()
  }

  moveToDlq(message: QueueMessage, reason: string): void {
    this.dlq.push({
      originalMessage: message,
      failedAt: new Date(),
      reason,
    })
  }

  getDlq(): DeadLetterMessage[] {
    return this.dlq
  }

  clear(): void {
    this.main = []
    this.dlq = []
  }

  get size(): number {
    return this.main.length
  }
}

export const queue = new MessageQueue()
