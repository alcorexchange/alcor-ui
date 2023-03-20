import axios from 'axios'

const AA_API_URLS = [
  'https://wax.api.atomicassets.io/',
  'https://wax-aa.eu.eosamsterdam.net/',
  'https://api.wax.liquidstudios.io/',
  'https://atomic.wax.tgg.gg/',
  'https://api.wax-aa.bountyblok.io/'
]

export default function (_, inject) {
  const api = axios.create({
    baseURL: AA_API_URLS,
    timeout: 2000
  })

  let lastWorkingIndex = 0

  api.interceptors.request.use((config) => {
    if (!config._baseURLIndex) {
      config._baseURLIndex = lastWorkingIndex
    }
    config.baseURL = AA_API_URLS[config._baseURLIndex]
    return config
  })

  api.interceptors.response.use((response) => {
    return response
  }, (error) => {
    const config = { ...error.config }
    console.log('failed with', config._baseURLIndex, 'trying', config._baseURLIndex + 1)
    config._baseURLIndex = config._baseURLIndex + 1
    if (config._baseURLIndex <= AA_API_URLS.length - 1) {
      lastWorkingIndex = config._baseURLIndex

      return new Promise((resolve) => {
        resolve(api(config))
      })
    } else {
      lastWorkingIndex = 0
      return Promise.reject(error);
    }

  })

  inject('api', api)
}
