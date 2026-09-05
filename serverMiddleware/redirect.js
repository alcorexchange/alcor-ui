const fs = require('fs')
const path = require('path')

let redirectHtml = null

module.exports = function (req, res, next) {
  const host = req.headers.host || ''
  const hostParts = host.split('.')

  // Root domain: alcor.exchange (length=2) или www.alcor.exchange
  const isRootDomain = (hostParts.length === 2 && host.endsWith('alcor.exchange')) ||
    (hostParts.length === 3 && hostParts[0] === 'www' && host.endsWith('alcor.exchange'))

  if (!isRootDomain) {
    return next()
  }

  const targetUrl = `https://wax.alcor.exchange${req.url}`

  // Боты получают 301 для SEO
  const userAgent = (req.headers['user-agent'] || '').toLowerCase()
  if (/bot|crawler|spider|google|bing|slurp|duckduck|baidu|yandex/i.test(userAgent)) {
    res.writeHead(301, { Location: targetUrl })
    res.end()
    return
  }

  // Пользователи видят страницу с таймером
  if (!redirectHtml) {
    const htmlPath = path.join(__dirname, '..', 'static', 'redirect', 'index.html')
    redirectHtml = fs.readFileSync(htmlPath, 'utf-8')
  }

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
  res.end(redirectHtml)
}
