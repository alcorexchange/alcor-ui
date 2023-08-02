import Vue from 'vue'

import { asset } from 'eos-common'
import { networks } from '~/config'

Vue.mixin({
  data() {
    return {
      windowWidth: 0,

      mousedownCls: [],
      mouseupCls: [],
    }
  },

  computed: {
    isMobile() {
      return (this.$device.isMobile) || (this.windowWidth && this.windowWidth <= 1175) || this.$route.path.includes('swap-widget')
    }
  },

  mounted() {
    // ⚠️  CALLING MULTIPLE TIMES!! FIXME
    this.windowWidth = window.innerWidth
    window.addEventListener('resize', () => {
      this.windowWidth = window.innerWidth
    })
  },

  methods: {
    async getToken(rpc, code, scope) {
      console.log('code', code, 'scope', scope)
      const { rows: [row] } = await rpc.get_table_rows({ code, scope, table: 'stat', limit: 1 })

      const decimal = row.max_supply.split('.')
      const [symbol, desimal_s] = decimal[1].split(' ')

      return {
        id: row,
        contract: code,
        symbol,
        precision: symbol.length
      }
    },

    inputToAsset(input, precision) {
      return asset((parseFloat(input) || 0).toFixed(precision) + ' XXX')
    },

    toFixed(value, precision) {
      return (parseFloat(value) || 0).toFixed(precision)
    },

    monitorTx(tx, network = null) {
      network = network ? networks[network] : this.$store.state.network

      let url = network.monitor + '/transaction/' + tx
      if (['eos', 'wax', 'telos'].includes(network.name)) url += '?tab=traces&' + network.monitor_params
      if (['ux'].includes(network.name)) url = url.replace('transaction', 'tx')

      return url
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
      const isWrapper = this.mousedownCls.includes('el-dialog__wrapper') && this.mouseupCls.includes('el-dialog__wrapper')
      const isClose = this.mousedownCls.includes('el-dialog__headerbtn') && this.mouseupCls.includes('el-dialog__headerbtn')
      const isCloseIcon = this.mousedownCls.includes('el-dialog__close') && this.mouseupCls.includes('el-dialog__close')
      if (isWrapper || isClose || isCloseIcon) {
        done()
      }
    },
  }
})
