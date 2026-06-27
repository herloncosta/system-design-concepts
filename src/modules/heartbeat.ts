const HEARTBEAT_INTERVAL_MS = 5000
const TIMEOUT_MS = 15000

export type HealthStatus = 'UP' | 'DOWN'

let lastHeartbeat = Date.now()

export function startHeartbeat(): void {
  setInterval(() => {
    lastHeartbeat = Date.now()
  }, HEARTBEAT_INTERVAL_MS)
}

export function getHealth(): { status: HealthStatus; lastBeat: string } {
  const isAlive = Date.now() - lastHeartbeat < TIMEOUT_MS

  return {
    status: isAlive ? 'UP' : 'DOWN',
    lastBeat: new Date(lastHeartbeat).toISOString(),
  }
}
