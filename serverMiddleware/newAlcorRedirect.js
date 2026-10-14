// Уводим заходы со старых доменов (wax./proton./eos./telos.alcor.exchange) в новый
// Alcor на alcor.exchange.
//
// - Ссылка на свап с парой (`/swap?input=WUF-wuffi&output=WAX-eosio.token`, её ставят
//   игры и проекты WAX) уводится всегда.
// - Остальные страницы с точным аналогом уводятся, только если человек пришёл с
//   внешнего сайта: поисковика, игры, проекта. Закладки и прямые заходы постоянных
//   юзеров остаются здесь, им предлагает переехать модалка `MigrationPromptModal`.
//
// Срабатывает только на первом заходе, то есть на запросе страницы к серверу.
// Переходы внутри старого приложения идут через роутер и сюда не попадают.
// 302, а не 301: 301 браузер запоминает навсегда.

const {
  VENUES,
  cleanPath,
  swapPairPath,
  counterpartPath,
  newAlcorTrackedUrl,
} = require('../utils/newAlcorRoutes')

function isExternal(referer) {
  try {
    const host = new URL(referer).hostname
    return host !== 'alcor.exchange' && !host.endsWith('.alcor.exchange')
  } catch (e) {
    return false
  }
}

module.exports = function (req, res, next) {
  const venue = VENUES[(req.headers.host || '').split('.')[0]]
  if (!venue) return next()

  const url = new URL(req.url, 'http://localhost')
  const path = cleanPath(url.pathname)

  const target = swapPairPath(venue, path, url.searchParams) ||
    (isExternal(req.headers.referer) && counterpartPath(venue, path, url.searchParams))
  if (!target) return next()

  res.writeHead(302, { Location: newAlcorTrackedUrl(target, 'redirect') })
  res.end()
}
