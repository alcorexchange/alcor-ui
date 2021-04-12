<template lang="pug">
.row(v-loading="loading")
  .items
    .item(v-for="wallet in wallets")
      AlcorButton.button(@click="login(wallet.index)" alternative)
        img(:src="wallet.logo" height="30").mr-2
        span {{ wallet.name }}
  .divider
    span.line
    .text I don't have any wallet yet
    span.line
  .footer-actions
  .items
    .item
      AlcorButton.button(alternative)
            img(:src="wallets[0] && wallets[0].logo" height="30").mr-2
            span Create Anchor
    .item
      AlcorButton.button(alternative)
            img(:src="wallets[1] && wallets[1].logo" height="30").mr-2
            span Create Scatter

    //.col
      .mb-2.mr-2
        el-button(size="large" @click="login(5)" v-if="network.name == 'proton'")
          img(src="~/assets/logos/keycat.svg" height="30").mr-2
          span Proton Wallet

      .mb-2.mr-2
        el-button(size="large" @click="login('wax')" v-if="network.name == 'wax'")
          img(src="~/assets/logos/wax.svg" height="30").mr-2
          span Wax Cloud Wallet

      .mb-2.mr-2
        el-button(size="large" @click="login(1)")
          img(src="~/assets/logos/anchor.svg" height="30").mr-2
          span Anchor

      .mb-2.mr-2
        el-button(size="large" @click="login(0)")
          img(src="~/assets/logos/scatter.svg" height="30").mr-2
          span Scatter / TP / Starteos

      .mb-2.mr-2
        el-button(size="large" @click="login(0)")
          img(src="~/assets/logos/wombat.png" height="30").mr-2

      .mb-2.mr-2
        el-button(size="large" @click="login(2)")
          img(src="~/assets/logos/simpleos.svg" height="30").mr-2
          span SimplEOS

      .mb-2.mr-2
        el-button(size="large" @click="login(3)")
          img(src="~/assets/logos/lynx.svg" height="30").mr-2
          span Lynx

      .mb-2.mr-2
        el-button(size="large" @click="login(4)")
          img(src="~/assets/logos/ledger.svg" height="30").mr-2
          span Ledger

      .mb-2.mr-2
        el-button(size="large" @click="login(5)" if="network.name == 'eos'")
          img(src="~/assets/logos/keycat.svg" height="30").mr-2
          span Keycat
</template>

<script>
import { captureException } from '@sentry/browser'
import { mapState } from 'vuex'
import AlcorButton from '@/components/AlcorButton'

export default {
  components: {
    AlcorButton
  },
  data() {
    return {
      loading: false,

      wallets: []
    }
  },

  computed: {
    ...mapState(['user', 'network'])
  },

  mounted() {
    console.log('login mounted')

    const wallets = [
      { name: 'Anchor', logo: require('@/assets/logos/anchor.svg'), index: 1 },
      {
        name: 'Scatter / TP / Starteos',
        logo: require('@/assets/logos/scatter.svg'),
        index: 0
      },
      {
        name: 'SimplEOS',
        logo: require('@/assets/logos/simpleos.svg'),
        index: 2
      },
      { name: 'Lynx', logo: require('@/assets/logos/lynx.svg'), index: 3 },
      { name: 'Ledger', logo: require('@/assets/logos/ledger.svg'), index: 4 }
    ]

    if (this.network.name == 'eos') {
      wallets.push({
        name: '',
        logo: require('@/assets/logos/wombat.png'),
        index: 0
      })
      wallets.push({
        name: 'Keycat',
        logo: require('@/assets/logos/keycat.svg'),
        index: 5
      })
    }

    if (this.network.name == 'wax') {
      wallets.unshift({
        name: 'Wax Cloud Wallet',
        logo: require('@/assets/logos/wax.svg'),
        index: 'wax'
      })
    }

    if (this.network.name == 'proton') {
      wallets.unshift({
        name: '',
        logo: require('@/assets/logos/proton_wallet.svg'),
        index: 5
      })
    }

    this.wallets = wallets
  },

  methods: {
    async login(provider) {
      this.loading = true

      try {
        await this.$store.dispatch('chain/login', provider)
        this.$store.dispatch('modal/closeModal')
      } catch (e) {
        captureException(e)
        this.$notify({
          title: `${provider} login error`,
          message: e,
          type: 'error'
        })
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.items {
  display: flex;
  flex-wrap: wrap;
  padding: 14px;
  width: 100%;
  .item {
    width: 50%;
    padding: 6px;
  }
}
.button {
  width: 100% !important;
  flex: 1;
  padding: 8px;
  justify-content: flex-start;
  border-radius: 12px !important;
  img {
    padding: 0 8px;
  }
  span {
    display: flex;
    justify-content: center;
    flex: 1;
  }
}
.divider {
  display: flex;
  align-items: center;
  padding: 8px 18px;
  width: 100%;
  .text {
    padding: 0 8px;
  }
  .line {
    flex: 1;
    height: 2px;
    background: rgba(100, 100, 100, 0.5);
  }
}
</style>
