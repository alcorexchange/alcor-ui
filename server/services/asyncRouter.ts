import { Router } from 'express'
import type { NextFunction, Request, Response } from 'express'

const ROUTE_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'all'] as const

// Express 4 ignores the promise an async handler returns: a thrown error never
// reaches next(), the request gets no answer, and route-cache keeps every later
// request to that URL queued behind it until the process restarts. Handlers of
// this router pass their rejections to next(), where the API's error handler answers.
function forwardRejection(handler: any) {
  if (typeof handler !== 'function' || handler.length === 4) return handler

  return (req: Request, res: Response, next: NextFunction) => {
    try {
      return Promise.resolve(handler(req, res, next)).catch(next)
    } catch (e) {
      next(e)
    }
  }
}

export function asyncRouter() {
  const router: any = Router()

  for (const method of ROUTE_METHODS) {
    const register = router[method].bind(router)
    router[method] = (path: any, ...handlers: any[]) => register(path, ...handlers.flat().map(forwardRejection))
  }

  return router as ReturnType<typeof Router>
}

export function apiErrorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error(`[api] ${req.method} ${req.originalUrl}:`, err)
  if (res.headersSent) return next(err)
  res.status(500).json({ error: 'Internal server error' })
}
