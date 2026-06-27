import express from 'express'
import { v4 as uuidv4 } from 'uuid'
import { check, saveResult } from './modules/idempotency.js'
import { queue } from './modules/queue.js'
import { startWorker } from './modules/worker.js'
import { startHeartbeat, getHealth } from './modules/heartbeat.js'

const PORT = 3000

const app = express()
app.use(express.json())

startWorker()
startHeartbeat()

app.get('/health', (_req, res) => {
  const health = getHealth()
  const httpStatus = health.status === 'UP' ? 200 : 503

  res.status(httpStatus).json({ api: 'UP', worker: health })
})

app.post('/api/orders', (req, res) => {
  const idempotencyKey = (req.headers['idempotency-key'] as string) || uuidv4()
  const record = check(idempotencyKey)

  if (record.status === 'COMPLETED') {
    res.status(200).json({
      message: 'Requisição já processada anteriormente (Idempotente)',
      data: record.data,
    })
    return
  }

  if (record.status === 'PROCESSING') {
    res.status(202).json({ message: 'Requisição já está em processamento.' })
    return
  }

  const messageId = uuidv4()

  queue.enqueue({
    id: messageId,
    idempotencyKey,
    payload: req.body,
    createdAt: new Date(),
  })

  res.status(202).json({
    message: 'Pedido recebido e enfileirado para processamento.',
    messageId,
    idempotencyKey,
  })

  setTimeout(() => {
    saveResult(idempotencyKey, { orderId: messageId, status: 'PROCESSADO_COM_SUCESSO' })
  }, 3000)
})

app.get('/api/dlq', (_req, res) => {
  const messages = queue.getDlq()

  res.json({
    totalFailedMessages: messages.length,
    messages,
  })
})

app.listen(PORT, () => {
  console.log(`API rodando na porta ${PORT}`)
})
