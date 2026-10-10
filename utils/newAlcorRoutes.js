// Где у страницы старого UI точный аналог в новом Alcor (alcor.exchange).
//
// Один список на два места: серверный редирект (`serverMiddleware/newAlcorRedirect.js`)
// и модалку переезда (`components/modals/MigrationPromptModal.vue`). Поэтому CommonJS:
// сервер требует его через require, клиент импортирует через webpack.

// Поддомен старого UI (он же `network.name`) → venue нового Alcor.
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

/** `/ru/trade/x/` → `/trade/x`: путь без языка и хвостового слэша. */
function cleanPath(pathname) {
  return pathname.replace(LOCALE, '').replace(/\/+$/, '') || '/'
}

/** Ссылка на свап с парой (`/swap?input=WUF-wuffi&output=WAX-eosio.token`). */
function swapPairPath(venue, path, query) {
  if (path !== '/swap') return null

  const pair = pairId(`${query.get('input')}_${query.get('output')}`)
  return pair && `/v/${venue}/swap/${pair}`
}

// Страница старого UI → путь в новом. null — аналога нет.
const ROUTES = [
  // Лендинг нового сам выбирает venue по поддомену, а на alcor.exchange это wax.
  // У остальных сетей своего лендинга нет, их главная — свап.
  [/^\/$/, (m, q, venue) => (venue === 'wax' ? '/' : `/v/${venue}/swap`)],

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

  [/^\/otc$/, (m, q, venue) => `/v/${venue}/otc`],
  [/^\/otc\/order\/(\d+)$/, (m, q, venue) => `/v/${venue}/otc/${m[1]}`],

  // Новый сам уводит на свап, если у сети нет стейкинга.
  [/^\/staking$/, (m, q, venue) => `/v/${venue}/staking`],
]

/**
 * Путь той же страницы в новом Alcor, или null, если аналога нет.
 *
 * @param {string} venue - из `VENUES`
 * @param {string} path - уже через `cleanPath`
 * @param {URLSearchParams} query
 */
function counterpartPath(venue, path, query) {
  const pair = swapPairPath(venue, path, query)
  if (pair) return pair

  for (const [pattern, toPath] of ROUTES) {
    const match = path.match(pattern)
    if (match) return toPath(match, query, venue)
  }
  return null
}

/**
 * Полная ссылка в новый Alcor с метками: `utm_source=alcor-old` — пришёл со старого,
 * `utm_campaign` — каким путём (redirect, prompt), чтобы сравнить каналы.
 */
function newAlcorTrackedUrl(path, campaign) {
  const url = new URL(path, 'https://alcor.exchange')
  url.searchParams.set('utm_source', 'alcor-old')
  url.searchParams.set('utm_campaign', campaign)
  return url.toString()
}

module.exports = {
  VENUES,
  cleanPath,
  swapPairPath,
  counterpartPath,
  newAlcorTrackedUrl,
}
