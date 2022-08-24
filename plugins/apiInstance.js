import axios from 'axios'

export default function(_, inject) {
  const api = axios.create({
    baseURL: 'http://wax.blokcrafters.io/'
  })

  api.interceptors.response.use(null, error => {
    console.log('eeee', error)
  })

  inject('api', api)
}
