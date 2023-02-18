import { sync } from 'vuex-router-sync'

export default ({ app, store }) => {
  sync(store, app.router)
}
