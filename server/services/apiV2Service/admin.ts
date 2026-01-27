import { Router, Request, Response, NextFunction } from 'express'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { getRedis } from '../redis'

const execFileAsync = promisify(execFile)

export const admin = Router()

// EOS/WAX contract name: a-z, 1-5, dot, 1-12 chars
const CONTRACT_REGEX = /^[a-z1-5.]{1,12}$/

// Token format: SYMBOL-contract (e.g., WAX-eosio.token)
const TOKEN_REGEX = /^[A-Za-z0-9]{1,7}-[a-z1-5.]{1,12}$/

function validateContract(value: string): boolean {
  return CONTRACT_REGEX.test(value)
}

function validateToken(value: string): boolean {
  return TOKEN_REGEX.test(value)
}

// Middleware для авторизации модератора
const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const password = req.headers['x-admin-password']

  if (!process.env.MODERATOR_PASSWORD) {
    return res.status(500).json({ error: 'MODERATOR_PASSWORD not configured' })
  }

  if (password !== process.env.MODERATOR_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  next()
}

// GET - получить текущие динамические scam списки
admin.get('/scam', authMiddleware, async (req: Request, res: Response) => {
  const network: Network = req.app.get('network')
  const redis = getRedis()

  try {
    const [contracts, tokens] = await Promise.all([
      redis.sMembers(`scam_contracts_${network.name}`),
      redis.sMembers(`scam_tokens_${network.name}`)
    ])

    res.json({
      scam_contracts: contracts,
      scam_tokens: tokens
    })
  } catch (e) {
    console.error('Failed to get scam lists from Redis:', e)
    res.status(500).json({ error: 'Failed to fetch scam lists' })
  }
})

// POST - добавить scam контракт/токен
admin.post('/scam', authMiddleware, async (req: Request, res: Response) => {
  const network: Network = req.app.get('network')
  const redis = getRedis()
  const { type, value } = req.body

  if (!value || typeof value !== 'string') {
    return res.status(400).json({ error: 'Value is required' })
  }

  if (!['contract', 'token'].includes(type)) {
    return res.status(400).json({ error: 'Type must be "contract" or "token"' })
  }

  const sanitized = value.toLowerCase().trim()

  // Validate format to prevent XSS and invalid data
  if (type === 'contract' && !validateContract(sanitized)) {
    return res.status(400).json({ error: 'Invalid contract format. Must be 1-12 chars: a-z, 1-5, dot' })
  }

  if (type === 'token' && !validateToken(value.trim())) {
    return res.status(400).json({ error: 'Invalid token format. Must be SYMBOL-contract (e.g., WAX-eosio.token)' })
  }

  const key = type === 'contract'
    ? `scam_contracts_${network.name}`
    : `scam_tokens_${network.name}`

  const valueToStore = type === 'contract' ? sanitized : value.toLowerCase().trim()

  try {
    await redis.sAdd(key, valueToStore)
    res.json({ success: true })
  } catch (e) {
    console.error('Failed to add scam entry:', e)
    res.status(500).json({ error: 'Failed to add entry' })
  }
})

// DELETE - удалить scam контракт/токен
admin.delete('/scam', authMiddleware, async (req: Request, res: Response) => {
  const network: Network = req.app.get('network')
  const redis = getRedis()
  const { type, value } = req.body

  if (!value || typeof value !== 'string') {
    return res.status(400).json({ error: 'Value is required' })
  }

  if (!['contract', 'token'].includes(type)) {
    return res.status(400).json({ error: 'Type must be "contract" or "token"' })
  }

  const key = type === 'contract'
    ? `scam_contracts_${network.name}`
    : `scam_tokens_${network.name}`

  try {
    await redis.sRem(key, value.toLowerCase().trim())
    res.json({ success: true })
  } catch (e) {
    console.error('Failed to remove scam entry:', e)
    res.status(500).json({ error: 'Failed to remove entry' })
  }
})

// ==================== DETECTIVE ====================

// POST - account report via script
admin.post('/detective/account-report', authMiddleware, async (req: Request, res: Response) => {
  const { account } = req.body

  if (!account || typeof account !== 'string') {
    return res.status(400).json({ error: 'Account is required' })
  }

  if (!validateContract(account.toLowerCase().trim())) {
    return res.status(400).json({ error: 'Invalid account format' })
  }

  try {
    const { stdout } = await execFileAsync(
      'node',
      ['/opt/alcor-tools/account-report.js', account.toLowerCase().trim(), '--json'],
      { timeout: 30000 }
    )
    const report = JSON.parse(stdout)
    res.json(report)
  } catch (e: any) {
    console.error('Account report failed:', e)
    res.status(500).json({ error: e.message || 'Failed to generate report' })
  }
})

// GET - CEX deposit lookup via Hyperion
admin.get('/detective/cex-lookup', authMiddleware, async (req: Request, res: Response) => {
  const network: Network = req.app.get('network')
  const { memo, account, limit, after, before } = req.query

  if (!memo || typeof memo !== 'string') {
    return res.status(400).json({ error: 'Memo is required' })
  }

  // Validate account if provided
  if (account) {
    if (typeof account !== 'string' || !validateContract(account.toLowerCase().trim())) {
      return res.status(400).json({ error: 'Invalid account format' })
    }
  }

  const hyperionUrl = network.hyperion
  if (!hyperionUrl) {
    return res.status(500).json({ error: 'Hyperion not configured for this network' })
  }

  const params = new URLSearchParams({
    'transfer.memo': memo,
    limit: String(limit || 100)
  })
  if (account) params.set('transfer.to', (account as string).toLowerCase().trim())
  if (after) params.set('after', String(after))
  if (before) params.set('before', String(before))

  try {
    const response = await fetch(`${hyperionUrl}/v2/history/get_actions?${params}`)
    if (!response.ok) {
      throw new Error(`Hyperion error: ${response.status}`)
    }
    const data = await response.json()
    res.json({
      total: data.total?.value || data.actions?.length || 0,
      actions: data.actions || []
    })
  } catch (e: any) {
    console.error('CEX lookup failed:', e)
    res.status(500).json({ error: e.message || 'Failed to fetch from Hyperion' })
  }
})
