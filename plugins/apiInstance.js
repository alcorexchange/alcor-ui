import axios from 'axios'
import multibase from 'axios-multibase'

const API_URLS_DEV = [
  'http://wax.api.aa.atomichub.io'
  // 'http://api.wax.liquidstudios.io/',
  // 'http://atomic.wax.tgg.gg/',
  // 'http://api.wax-aa.bountyblok.io/'
]

const API_URLS_PROD = [
  'https://wax.api.aa.atomichub.io'
  // 'https://api.wax.liquidstudios.io/',
  // 'https://atomic.wax.tgg.gg/',
  // 'https://api.wax-aa.bountyblok.io/'
]

export default function(_, inject) {
  const api = axios.create({
    baseURL: process.env.isDev ? API_URLS_DEV : API_URLS_PROD
  })

  api.interceptors.request.use(multibase)

  inject('api', api)
}
