import Vue from 'vue'

import ElementUI from 'element-ui/lib/element-ui.common'
import locale from 'element-ui/lib/locale/lang/en'

// Custom elements
import AlcorTabs from '~/components/alcor-element/tabs/tabs'

export default () => {
  Vue.use(ElementUI, { locale })

  // Custom components
  Vue.component(AlcorTabs.name, AlcorTabs)
}
