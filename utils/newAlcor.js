const NEW_ALCOR_ORIGIN = 'https://alcor.exchange'

/**
 * Network name here is not the venue id over there: Proton trades as `xpr` and
 * EOS as `vaulta` on the new frontend.
 */
const VENUE_BY_NETWORK = {
  proton: 'xpr',
  eos: 'vaulta',
}

/**
 * Link to the same account's world on the new Alcor.
 *
 * @param {string} network - `$store.state.network.name`
 * @param {string} path - path under the venue, e.g. `/swap/farms`
 */
export function newAlcorUrl(network, path = '') {
  const venue = VENUE_BY_NETWORK[network] || network
  return `${NEW_ALCOR_ORIGIN}/v/${venue}${path}`
}

/**
 * Sections that already exist on the new frontend, keyed by the path here.
 *
 * A cross-domain canonical is a request to Google: index that URL instead of
 * this one, and give it the standing this page earned. It is only honest —
 * and only honoured — where the two pages are genuinely the same thing, so
 * this list stays deliberately short and grows a section at a time.
 *
 * Deliberately absent: the landing page, /markets, and everything the new
 * frontend has no answer for (NFTs, the bridge, accounts, docs). Pointing
 * those away would drop them out of the index for nothing.
 */
const MIGRATED_SECTIONS = [
  [/^\/swap\/?$/, () => '/swap'],
  [/^\/trade\/([^/]+)\/?$/, ([, slug]) => `/spot/${slug.toLowerCase()}`],
  [/^\/positions\/?$/, () => '/swap/positions'],
  [/^\/positions\/new(?:\/.*)?$/, () => '/swap/positions/new'],
  [/^\/positions\/(\d+)\/?$/, ([, id]) => `/swap/positions/${id}`],
  [/^\/farm\/?$/, () => '/swap/farms'],
  [/^\/analytics\/?$/, () => '/analytics'],
  [/^\/analytics\/tokens\/([^/]+)\/?$/, ([, id]) => `/analytics/tokens/${id.toLowerCase()}`],
  [/^\/analytics\/pools\/(\d+)\/?$/, ([, id]) => `/analytics/pools/${id}`],
  [/^\/otc\/?$/, () => '/otc'],
  [/^\/otc\/order\/(\d+)\/?$/, ([, id]) => `/otc/${id}`],
  [/^\/staking\/?$/, () => '/staking']
]

const LOCALE_PREFIX = /^\/(ru|cn|ph|ua|it)(?=\/|$)/

/**
 * The new Alcor URL this page should hand its ranking to, or null when this
 * page is still the only place its content lives.
 *
 * The new frontend is English-only, so every locale of a page points at the
 * same URL over there.
 *
 * @param {string} network - `$store.state.network.name`
 * @param {string} path - `$route.path`
 */
export function newAlcorCanonical(network, path) {
  if (!path) return null

  const withoutLocale = path.replace(LOCALE_PREFIX, '') || '/'

  for (const [pattern, toNewPath] of MIGRATED_SECTIONS) {
    const match = withoutLocale.match(pattern)
    if (match) return newAlcorUrl(network, toNewPath(match))
  }

  return null
}
