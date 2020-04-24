import axios from 'axios'

import axiosRetry from 'axios-retry'
axiosRetry(axios, { retries: 3 })

import config from '../config'

const IP_REGEX = RegExp(/^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]):[0-9]+$/)

export function serverInit(req, res, next) {
  const subdomain = req.headers.host.split('.')

  if (IP_REGEX.test(req.headers.host)) {
    req.app.set('network', config.networks.eos)
  } else if (subdomain.length <= 2) {
    req.app.set('network', config.networks.eos)
  } else {
    req.app.set('network', config.networks[subdomain[0]])
  }

  //const port = req.app.settings.port;
  //res.locals.requested_url = req.protocol + '://' + req.host  + ( port == 80 || port == 443 ? '' : ':'+port ) + req.path;


  //const axiosInstance = axios.create({
  //  baseURL: 'https://some-domain.com/api/',
  //  timeout: 1000,
  //})


  req.app.set('axios', axios)

  next()
}
