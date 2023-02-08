<template lang="pug">
#assets-modal-component.login-modal
  | {{ loginContext}}
  .header
    .text-center.p-3 Select wallet
  .body.row(v-loading='loading')
    .items
      .item(v-for='wallet in wallets')
        AlcorButton.button(@click='login(wallet.id)', alternative)
          img.mr-2(:src='wallet.logo', height='30')
          span {{ wallet.name }}
    .divider
      span.line
      .text {{ $t("Don't have any wallet yet") }} ?
      span.line
    .footer-actions
    .items(v-if='wallets.length > 0')
      .item
        AlcorButton.button(alternative, @click='openInNewTab(wallets[0].create)')
          img.mr-2(:src='wallets[0].logo', height='30')
          span {{ $t('Get') }} {{ $t(wallets[0].name) }}
      .item
        AlcorButton.button(alternative, @click='openInNewTab(wallets[1].create)')
          img.mr-2(:src='wallets[1].logo', height='30')
          span {{ $t('Get') }} {{ $t(wallets[1].name) }}
</template>

<script>
// TODO Добавить открытие кошельков под разные чейны
import { captureException } from '@sentry/browser'
import { mapState } from 'vuex'
import AlcorButton from '@/components/AlcorButton'
import AlcorModal from '~/components/AlcorModal.vue'

export default {
  components: {
    AlcorButton,
    AlcorModal
  },
  data() {
    return {
      loading: false
    }
  },

  computed: {
    ...mapState(['user', 'network']),
    ...mapState('chain', ['loginContext']),

    wallets() {
      const chain = this.loginContext ? this.loginContext.chain : this.network.name

      const wallets = [
        {
          id: 'anchor',
          name: 'Anchor',
          logo: require('@/assets/logos/anchor.svg'),
          create: 'https://greymass.com/en/anchor/'
        },
        {
          id: 'scatter',
          name: 'Scatter / TP / Starteos',
          logo: require('@/assets/logos/scatter.svg'),
          create:
            'https://github.com/GetScatter/ScatterDesktop/releases/tag/11.0.1'
        },
        {
          name: 'SimplEOS',
          logo: require('@/assets/logos/simpleos.svg')
        },
        //{ name: 'Lynx', logo: require('@/assets/logos/lynx.svg') },
        { name: 'Ledger', logo: require('@/assets/logos/ledger.svg') }
      ]

      if (chain == 'eos') {
        wallets.push({
          id: 'scatter',
          name: '',
          logo: require('@/assets/logos/wombat.png')
        })
        wallets.push({
          name: 'Keycat',
          logo: require('@/assets/logos/keycat.svg')
        })
      }

      if (chain == 'wax') {
        wallets.unshift({
          id: 'wcw',
          name: 'Wax Cloud Wallet',
          logo: require('@/assets/logos/wax.svg'),
          index: 'wax',
          create: 'https://all-access.wax.io/'
        })
        wallets.push({
          id: 'scatter',
          name: '',
          logo: require('@/assets/logos/wombat.png')
        })
      }

      if (this.network.name == 'proton' || this.$store.state.chain.loginContext?.chain == 'proton') {
        wallets.unshift({
          id: 'proton',
          name: 'Proton',
          logo: require('@/assets/icons/proton.png'),
          create: 'https://www.protonchain.com/wallet/'
        })
      }

      return wallets
    }
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
        this.$store.state.modal.context = null
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.login-modal {
  max-width: 650px;
  .body {
    padding: 15px;
  }
}

.items {
  display: flex;
  flex-wrap: wrap;
  padding: 14px;
  width: 840px;

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

@media only screen and (max-width: 840px) {
  .items {
    .item {
      width: 100%;
    }
  }
}
</style>
