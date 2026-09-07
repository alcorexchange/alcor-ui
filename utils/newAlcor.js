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
