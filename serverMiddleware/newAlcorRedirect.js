// Уводим заходы со старых доменов (wax./proton./eos./telos.alcor.exchange) в новый
// Alcor на alcor.exchange: каждую страницу, у которой там есть аналог.
//
// Кто выбрал остаться, тот остаётся: cookie `alcor_ui=old` (см. `utils/oldUiChoice.js`)
// ставят ссылка «Back to the old version» в новом (`?ui=old`) и кнопка «Stay on the
// old version» в модалке `MigrationPromptModal`. Модалка же ловит тех, кто зашёл на
// страницу без аналога и дошёл до страницы с ним внутри приложения.
//
// Срабатывает только на первом заходе, то есть на запросе страницы к серверу.
// Переходы внутри старого приложения идут через роутер и сюда не попадают.
// 302, а не 301: 301 браузер запоминает навсегда.

const { VENUES, cleanPath, counterpartPath, newAlcorTrackedUrl } = require('../utils/newAlcorRoutes')
const { STAY_PARAM, OLD, stayCookie, staysOnOld } = require('../utils/oldUiChoice')

module.exports = function (req, res, next) {
  const hostname = (req.headers.host || '').split(':')[0]
  const venue = VENUES[hostname.split('.')[0]]
  if (!venue) return next()

  const url = new URL(req.url, 'http://localhost')

  // Пришёл по «Back to the old version»: запоминаем выбор и убираем метку из
  // адреса, чтобы она не попала в закладку.
  if (url.searchParams.get(STAY_PARAM) === OLD) {
    url.searchParams.delete(STAY_PARAM)
    res.writeHead(302, { 'Set-Cookie': stayCookie(hostname), Location: url.pathname + url.search })
    return res.end()
  }

  if (staysOnOld(req.headers.cookie)) return next()

  const target = counterpartPath(venue, cleanPath(url.pathname), url.searchParams)
  if (!target) return next()

  // Откуда увели: новый покажет дорогу назад на эту же страницу.
  const from = `https://${hostname}${url.pathname}${url.search}`
  res.writeHead(302, { Location: newAlcorTrackedUrl(target, 'redirect', from) })
  res.end()
}
