import axios from 'axios'
import multibase from 'axios-multibase'

const API_URLS_DEV = [
  'http://wax.blokcrafters.io/',
  'http://api.wax.liquidstudios.io/',
  'http://aa.wax.blacklusion.io/',
  'http://atomic.wax.tgg.gg/',
  'http://atomic.hivebp.io/',
  'http://api.wax-aa.bountyblok.io/'
]

const API_URLS_PROD = [
  'https://wax.blokcrafters.io/',
  'https://api.wax.liquidstudios.io/',
  'https://aa.wax.blacklusion.io/',
  'https://atomic.wax.tgg.gg/',
  'https://atomic.hivebp.io/',
  'https://api.wax-aa.bountyblok.io/'
]

export default function(_, inject) {
  const api = axios.create({
    baseURL: process.env.isDev ? API_URLS_DEV : API_URLS_PROD
  })

  api.interceptors.request.use(multibase)

  inject('api', api)
}
