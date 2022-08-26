import axios from 'axios'
import multibase from 'axios-multibase'

const API_URLS = [
  'http://wax.blokcrafters.io/',
  'http://api.wax.liquidstudios.io/',
  'http://aa.wax.blacklusion.io/',
  'http://atomic.wax.tgg.gg/',
  'http://atomic.hivebp.io/',
  'https://api.wax-aa.bountyblok.io/'
]

export default function(_, inject) {
  const api = axios.create({
    baseURL: API_URLS
  })

  api.interceptors.request.use(multibase)

  inject('api', api)
}
