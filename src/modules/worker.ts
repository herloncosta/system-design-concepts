import { queue, type QueueMessage } from './queue.js'

const MAX_RETRIES = 3
const BACKOFF_BASE_MS = 1000
const POLL_INTERVAL_MS = 1000

type PaymentResult = { transactionId: string; status: string }

async function callExternalService(): Promise<PaymentResult> {
  if (Math.random() < 0.6) {
    throw new Error('Falha no Gateway de Pagamento (Timeout)')
  }

  return { transactionId: `TXN-${Date.now()}`, status: 'SUCCESS' }
}

export async function processMessage(
  message: QueueMessage,
  process: () => Promise<PaymentResult> = callExternalService,
): Promise<void> {
  let attempt = 0

  while (attempt < MAX_RETRIES) {
    try {
      await process()
      return
    } catch {
      attempt++

      if (attempt >= MAX_RETRIES) {
        queue.moveToDlq(message, `Esgotadas ${MAX_RETRIES} tentativas`)
        return
      }

      const delay = Math.pow(2, attempt) * BACKOFF_BASE_MS
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
}

export function startWorker(): void {
  setInterval(() => {
    const message = queue.dequeue()
    if (message) processMessage(message)
  }, POLL_INTERVAL_MS)
}
