import Vue from 'vue'

import { asset } from 'eos-common'

Vue.mixin({
  data() {
    return {
      windowWidth: 0,

      mousedownCls: [],
      mouseupCls: []
    }
  },

  computed: {
    isMobile() {
      return (this.$device.isMobile) || (this.windowWidth && this.windowWidth <= 1175)
    }
  },

  mounted() {
    this.windowWidth = window.innerWidth
    window.addEventListener('resize', () => {
      this.windowWidth = window.innerWidth
    })
  },

  methods: {
    inputToAsset(input, precision) {
      return asset((parseFloat(input) || 0).toFixed(precision) + ' XXX')
    },

    toFixed(value, precision) {
      return (parseFloat(value) || 0).toFixed(precision)
    },

    monitorTx(tx) {
      const network = this.$store.state.network
      return `${network.monitor}/transaction/${tx}?tab=traces&${network.monitor_params}`
    },

    monitorAccount(account) {
      return `${this.$store.state.network.monitor}/account/${account}?${this.$store.state.network.monitor_params}`
    },

    openInNewTab(url) {
      window.open(url, '_blank')
    },

    // El-dialog fix
    dialogMousedown(e) {
      this.mousedownCls = [...e.target.classList]
    },

    dialogMouseup(e) {
      this.mouseupCls = [...e.target.classList]
    },

    beforeDialogClose(done) {
      console.log('beforeDialogClose')
      const isWrapper = this.mousedownCls.includes('el-dialog__wrapper') && this.mouseupCls.includes('el-dialog__wrapper')
      const isClose = this.mousedownCls.includes('el-dialog__close') && this.mouseupCls.includes('el-dialog__close')
      if (isWrapper || isClose) {
        done()
      }
    }
  }
})
