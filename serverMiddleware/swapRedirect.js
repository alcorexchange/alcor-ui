// Прямые ссылки на свап со старых доменов (игры и проекты WAX ставят
// `wax.alcor.exchange/swap?input=WUF-wuffi&output=WAX-eosio.token`) уводим в новый
// Alcor: `alcor.exchange/v/wax/swap/wuf-wuffi_wax-eosio.token`.
//
// Только первый заход — это запрос страницы к серверу. Переходы внутри старого
// приложения идут через роутер и сюда не попадают. Только ссылки с парой: голый
// `/swap` остаётся на месте. 302, а не 301 — браузер 301 запоминает навсегда.

// Поддомен старого UI → venue нового Alcor.
const VENUES = {
  wax: 'wax',
  proton: 'xpr',
  eos: 'vaulta',
  telos: 'telos',
}

// `WUF-wuffi` → `wuf-wuffi`. Символ — A-Z до 7 знаков, контракт — имя Antelope.
const TOKEN = /^([a-z]{1,7})-([a-z1-5.]{1,12})$/

function tokenId(value) {
  const id = String(value || '').toLowerCase()
  return TOKEN.test(id) ? id : null
}

module.exports = function (req, res, next) {
  const venue = VENUES[(req.headers.host || '').split('.')[0]]
  if (!venue) return next()

  const url = new URL(req.url, 'http://localhost')
  if (url.pathname.replace(/\/$/, '') !== '/swap') return next()

  const input = tokenId(url.searchParams.get('input'))
  const output = tokenId(url.searchParams.get('output'))
  if (!input || !output || input === output) return next()

  res.writeHead(302, { Location: `https://alcor.exchange/v/${venue}/swap/${input}_${output}` })
  res.end()
}
