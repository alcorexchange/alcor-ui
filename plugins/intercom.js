import { Intercom } from '@mathieustan/vue-intercom'

const appId = 'tcs47dbx'

export default ({ store }) => {
  const intercom = new Intercom({ appId })
  intercom.shutdown()

  if (store.state.network.name == 'eos') {
    intercom.once('ready', () => {
      intercom.boot('alcor')
      intercom.show()
      console.log('intercom booted')
    })
  }
}
