import axios from 'axios'
import multibase from 'axios-multibase'

const API_URLS = [
  'https://wax-aa.eu.eosamsterdam.net/',
  'https://api.wax.liquidstudios.io/',
  'https://atomic.wax.tgg.gg/',
  'https://api.wax-aa.bountyblok.io/'
]

export default function(_, inject) {
  const api = axios.create({
    baseURL: API_URLS,
    timeout: 2000
  })

  api.interceptors.request.use(multibase)

  inject('api', api)
}
