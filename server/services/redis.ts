import { createClient, RedisClientType } from 'redis'

let client: RedisClientType | null = null
let publisher: RedisClientType | null = null
let subscriber: RedisClientType | null = null
let connectionPromise: Promise<void> | null = null

export async function initRedis(): Promise<void> {
  if (connectionPromise) return connectionPromise

  connectionPromise = (async () => {
    client = createClient()
    publisher = client.duplicate()
    subscriber = client.duplicate()

    await Promise.all([
      client.connect(),
      publisher.connect(),
      subscriber.connect()
    ])

    console.log('Redis connected (client + publisher + subscriber)')
  })()

  return connectionPromise
}

export function getRedis(): RedisClientType {
  if (!client?.isOpen) throw new Error('Redis not connected. Call initRedis() first')
  return client
}

export function getPublisher(): RedisClientType {
  if (!publisher?.isOpen) throw new Error('Redis publisher not connected')
  return publisher
}

export function getSubscriber(): RedisClientType {
  if (!subscriber?.isOpen) throw new Error('Redis subscriber not connected')
  return subscriber
}

export async function closeRedis(): Promise<void> {
  await Promise.all([
    client?.quit(),
    publisher?.quit(),
    subscriber?.quit()
  ])
  client = publisher = subscriber = null
  connectionPromise = null
}
