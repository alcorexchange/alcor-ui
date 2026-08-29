import http from 'http'
import https from 'https'

// Talking to a Wire node needs a hand-rolled transport for two independent reasons,
// each of which looks like a flaky network until you know about it:
//
//   1. The node listens on 6666, which is on the WHATWG "bad ports" blocklist.
//      Node's built-in fetch (undici) refuses it outright, before any socket opens.
//   2. Without an explicit Content-Length, Node falls back to chunked
//      transfer-encoding, and nodeop's http_plugin drops chunked bodies mid-send
//      (surfacing as ECONNRESET, socket hang up or a bare 503).
//
// Set WIRE_HTTP_PROXY when the direct route to the node is throttled — the local
// xray proxy is a plain HTTP forward proxy, so requests carry an absolute URI.

const PROXY = process.env.WIRE_HTTP_PROXY || ''
const ATTEMPTS = Number(process.env.WIRE_HTTP_ATTEMPTS) || 3
const TIMEOUT_MS = Number(process.env.WIRE_HTTP_TIMEOUT_MS) || 30000

function requestOptions(url: string, options: any) {
  const target = new URL(url)
  const headers: Record<string, any> = { 'Content-Type': 'application/json', ...(options.headers || {}) }

  if (options.body) headers['Content-Length'] = Buffer.byteLength(options.body)

  const base = { method: options.method || 'POST', headers, timeout: TIMEOUT_MS }

  if (!PROXY) {
    return {
      transport: target.protocol === 'https:' ? https : http,
      options: {
        ...base,
        protocol: target.protocol,
        hostname: target.hostname,
        port: target.port,
        path: target.pathname + target.search,
      },
    }
  }

  const proxy = new URL(PROXY)
  return {
    transport: http,
    options: { ...base, hostname: proxy.hostname, port: proxy.port, path: url, headers: { ...headers, Host: target.host } },
  }
}

function request(url: string, options: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const { transport, options: reqOptions } = requestOptions(url, options)

    const req = transport.request(reqOptions, (res) => {
      const chunks: Buffer[] = []
      res.on('data', (chunk) => chunks.push(chunk))
      res.on('error', reject)
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8')
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          text: async () => body,
          json: async () => JSON.parse(body),
        })
      })
    })

    req.on('timeout', () => req.destroy(new Error(`wire http timeout (${TIMEOUT_MS}ms)`)))
    req.on('error', reject)

    if (options.body) req.write(options.body)
    req.end()
  })
}

/**
 * fetch-compatible transport for a Wire node, for passing to JsonRpc as `args.fetch`.
 *
 * Retries transport failures only: an HTTP response is returned as-is, however bad
 * its status, so the caller decides what a 500 means.
 */
export async function wireFetch(url: string, options: any = {}): Promise<any> {
  let lastError: any

  for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
    try {
      return await request(url, options)
    } catch (e) {
      lastError = e
      console.log(`[wire] ${url} attempt ${attempt}/${ATTEMPTS} failed: ${e.message}`)
    }
  }

  throw lastError
}
