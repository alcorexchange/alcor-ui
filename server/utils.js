import config from '../config'

const IP_REGEX = RegExp(/^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]):[0-9]+$/)

export function serverInit(req, res, next) {
  if (process.env.NETWORK) {
    req.app.set('network', config.networks[process.env.NETWORK])
    return next()
  }

  const subdomain = req.headers.host.split('.')

  if (IP_REGEX.test(req.headers.host)) {
    req.app.set('network', config.networks.eos)
  } else if (subdomain.length <= 2) {
    req.app.set('network', config.networks.eos)
  } else {
    req.app.set('network', config.networks[subdomain[0]])
  }

  next()
}
