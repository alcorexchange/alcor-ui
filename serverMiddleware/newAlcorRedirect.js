// Уводим заходы со старых доменов (wax./proton./eos./telos.alcor.exchange) в новый
// Alcor на alcor.exchange.
//
// - Ссылка на свап с парой (`/swap?input=WUF-wuffi&output=WAX-eosio.token`, её ставят
//   игры и проекты WAX) уводится всегда.
// - Остальные страницы с точным аналогом уводятся, только если человек пришёл с
//   внешнего сайта: поисковика, игры, проекта. Закладки и прямые заходы постоянных
//   юзеров остаются здесь, их переводим потом.
//
// Срабатывает только на первом заходе, то есть на запросе страницы к серверу.
// Переходы внутри старого приложения идут через роутер и сюда не попадают.
// 302, а не 301: 301 браузер запоминает навсегда. `utm_source=alcor-old` нужен,
// чтобы в аналитике нового Alcor было видно, кто пришёл отсюда.

// Поддомен старого UI → venue нового Alcor.
const VENUES = {
  wax: 'wax',
  proton: 'xpr',
  eos: 'vaulta',
  telos: 'telos',
}

// Языковой префикс старого UI (`/ru/trade/...`). В новом языков нет.
const LOCALE = /^\/(en|ru|cn|ph|ua|it)(?=\/|$)/

// `WUF-wuffi` → `wuf-wuffi`. Символ — A-Z до 7 знаков, контракт — имя Antelope.
const TOKEN = /^[a-z]{1,7}-[a-z1-5.]{1,12}$/

const NUMBER = /^\d+$/

function tokenId(value) {
  const id = String(value || '').toLowerCase()
  return TOKEN.test(id) ? id : null
}

// `tlm-alien.worlds_wax-eosio.token`: ключ пары одинаковый в старом и новом.
function pairId(value) {
  const tokens = String(value || '').toLowerCase().split('_')
  if (tokens.length !== 2) return null

  const [a, b] = tokens.map(tokenId)
  return a && b && a !== b ? `${a}_${b}` : null
}

function isExternal(referer) {
  try {
    const host = new URL(referer).hostname
    return host !== 'alcor.exchange' && !host.endsWith('.alcor.exchange')
  } catch (e) {
    return false
  }
}

function swapPairPath(venue, path, query) {
  if (path !== '/swap') return null

  const pair = pairId(`${query.get('input')}_${query.get('output')}`)
  return pair && `/v/${venue}/swap/${pair}`
}

// Страница старого UI → путь в новом. null — аналога нет, остаёмся здесь.
const EXTERNAL_ROUTES = [
  // Лендинг нового сам выбирает venue по поддомену, а на alcor.exchange это wax.
  [/^\/$/, (m, q, venue) => (venue === 'wax' ? '/' : null)],

  [/^\/trade\/([^/]+)$/, (m, q, venue) => {
    const pair = pairId(m[1])
    return pair && `/v/${venue}/spot/${pair}`
  }],
  [/^\/markets$/, (m, q, venue) => `/v/${venue}/analytics?tab=pairs`],

  // `?output=` без `?input=` новый своп не понимает, такие остаются.
  [/^\/swap$/, (m, q, venue) => {
    if (q.has('output')) return null
    if (!q.has('input')) return `/v/${venue}/swap`

    const input = tokenId(q.get('input'))
    return input && `/v/${venue}/swap?input=${input}`
  }],

  [/^\/positions$/, (m, q, venue) => `/v/${venue}/swap/positions`],
  [/^\/positions\/new$/, (m, q, venue) => {
    const params = new URLSearchParams()
    const tokenA = tokenId(q.get('left'))
    const tokenB = tokenId(q.get('right'))
    if (tokenA) params.set('tokenA', tokenA)
    if (tokenB) params.set('tokenB', tokenB)

    const search = params.toString()
    return `/v/${venue}/swap/positions/new${search ? `?${search}` : ''}`
  }],
  [/^\/positions\/(\d+)$/, (m, q, venue) => `/v/${venue}/swap/positions/${m[1]}`],
  [/^\/farm$/, (m, q, venue) => `/v/${venue}/swap/farms`],

  [/^\/analytics$/, (m, q, venue) => `/v/${venue}/analytics`],
  [/^\/analytics\/spots$/, (m, q, venue) => `/v/${venue}/analytics?tab=pairs`],
  [/^\/analytics\/tokens\/([^/]+)$/, (m, q, venue) => {
    const token = tokenId(m[1])
    return token && `/v/${venue}/analytics/tokens/${token}`
  }],
  [/^\/analytics\/pools\/([^/]+)$/, (m, q, venue) => (
    NUMBER.test(m[1]) ? `/v/${venue}/analytics/pools/${m[1]}` : null
  )],

  [/^\/wallet(\/tokens)?$/, (m, q, venue) => `/v/${venue}/portfolio`],
  [/^\/wallet\/liquidity_pools$/, (m, q, venue) => `/v/${venue}/portfolio?tab=liquidity`],
  [/^\/wallet\/farms$/, (m, q, venue) => `/v/${venue}/portfolio?tab=farms`],
  [/^\/wallet\/resources$/, (m, q, venue) => `/v/${venue}/portfolio?tab=resources`],
  [/^\/wallet\/positions$/, (m, q, venue) => `/v/${venue}/swap/positions`],
]

function externalPath(venue, path, query) {
  for (const [pattern, toPath] of EXTERNAL_ROUTES) {
    const match = path.match(pattern)
    if (match) return toPath(match, query, venue)
  }
  return null
}

function newAlcorUrl(path) {
  const url = new URL(path, 'https://alcor.exchange')
  url.searchParams.set('utm_source', 'alcor-old')
  return url.toString()
}

module.exports = function (req, res, next) {
  const venue = VENUES[(req.headers.host || '').split('.')[0]]
  if (!venue) return next()

  const url = new URL(req.url, 'http://localhost')
  const path = url.pathname.replace(LOCALE, '').replace(/\/+$/, '') || '/'

  const target = swapPairPath(venue, path, url.searchParams) ||
    (isExternal(req.headers.referer) && externalPath(venue, path, url.searchParams))
  if (!target) return next()

  res.writeHead(302, { Location: newAlcorUrl(target) })
  res.end()
}
