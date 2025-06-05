import 'dotenv/config' // Импорт dotenv для ESM

import mongoose from 'mongoose'
import { createClient } from 'redis'
import { mongoConnect } from '../../utils'
import { startUpdaters } from './start'

// Создаем Redis-клиент
const redisClient = createClient()

// Функция для установления соединений
async function makeConnections() {
  if (!redisClient.isOpen) {
    await redisClient.connect()
    console.log('Redis connected..')
  }

  await mongoConnect()
  console.log('MongoDB connected!')
}

// Функция для повторных попыток с ограничением
async function connectWithRetry(maxRetries = 5, delayMs = 2000) {
  let retries = 0

  while (retries < maxRetries) {
    try {
      await makeConnections()
      return // Успешно подключились, выходим
    } catch (e) {
      retries++
      console.error(`Connection attempt ${retries}/${maxRetries} failed: ${e.message}`)
      if (retries === maxRetries) {
        throw new Error('Failed to connect after max retries')
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }
}

// Основная функция запуска
async function start() {
  try {
    await connectWithRetry()
    startUpdaters()
  } catch (e) {
    console.error('Startup failed:', e)
    process.exit(1)
  }

  // Обработка сигналов завершения
  const shutdown = async () => {
    console.log('Shutting down...')
    await redisClient.quit()
    await mongoose.connection.close()
    process.exit(0)
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

// Запуск
start()
