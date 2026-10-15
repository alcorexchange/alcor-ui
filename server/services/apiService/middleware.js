import config from '../../../config'

const IP_REGEX = RegExp(/^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]):[0-9]+$/)

// Hosts that name no chain: the bare domain and the API host. Per-chain routes on them
// answer for WAX, the chain the bare domain always served; /api/v3/feed spans all chains.
const CHAINLESS_SUBDOMAINS = ['api']

export function networkResolver(req, res, next) {
  if (process.env.NETWORK) {
    req.app.set('network', config.networks[process.env.NETWORK])
    return next()
  }

  const subdomain = req.headers.host.split('.')

  if (IP_REGEX.test(req.headers.host)) {
    req.app.set('network', config.networks.wax)
  } else if (subdomain.length <= 2 || CHAINLESS_SUBDOMAINS.includes(subdomain[0])) {
    req.app.set('network', config.networks.wax)
  } else {
    const network = config.networks[subdomain[0]]
    if (!network) return res.status(404).send(`Unknown network ${subdomain[0]}`)

    req.app.set('network', network)
  }

  next()
}
