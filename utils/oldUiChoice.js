// Выбор «остаться на старом UI». Живёт в cookie на `.alcor.exchange`, поэтому его
// видят и сервер старого (`serverMiddleware/newAlcorRedirect.js`), и модалка
// переезда (`components/modals/MigrationPromptModal.vue`) на любом поддомене.
// CommonJS по той же причине, что и `newAlcorRoutes.js`.

const COOKIE = 'alcor_ui'
const OLD = 'old'
const STAY_DAYS = 14

// Ссылка «Use the old version» из нового Alcor: `?ui=old`.
const STAY_PARAM = 'ui'

const PARENT_DOMAIN = 'alcor.exchange'

function cookieAttributes(hostname, maxAge) {
  const attributes = [`Max-Age=${maxAge}`, 'Path=/', 'SameSite=Lax']
  if (hostname === PARENT_DOMAIN || hostname.endsWith(`.${PARENT_DOMAIN}`)) {
    attributes.push(`Domain=.${PARENT_DOMAIN}`, 'Secure')
  }
  return attributes.join('; ')
}

/** Cookie, по которому сервер STAY_DAYS дней не уводит в новый. */
function stayCookie(hostname) {
  return `${COOKIE}=${OLD}; ${cookieAttributes(hostname, STAY_DAYS * 24 * 60 * 60)}`
}

/** Тот же cookie со сроком 0: выбор снят, сервер снова уводит. */
function leaveCookie(hostname) {
  return `${COOKIE}=; ${cookieAttributes(hostname, 0)}`
}

/** @param {string | undefined} cookies - заголовок Cookie или document.cookie */
function staysOnOld(cookies) {
  return new RegExp(`(?:^|;\\s*)${COOKIE}=${OLD}(?:;|$)`).test(cookies || '')
}

module.exports = {
  STAY_PARAM,
  OLD,
  stayCookie,
  leaveCookie,
  staysOnOld,
}
