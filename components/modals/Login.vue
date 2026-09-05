<template lang="pug">
#assets-modal-component.login-modal
  .header
    //.lead {{ context }}
    .text-center(v-if="context && context.message") {{ context.message }}
      .fs-20 {{ context.chain }}
    .text-center.p-3(v-else) {{ $t('Select wallet') }}
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
    .items(v-if='wallets.length > 0')
      .item
        AlcorButton.button(alternative, @click='openInNewTab(wallets[1].create)')
          img.mr-2(:src='wallets[1].logo', height='30')
          span {{ $t('Get') }} {{ $t(wallets[1].name) }}
      .item
        AlcorButton.button(alternative, @click='openInNewTab(wallets[0].create)')
          img.mr-2(:src='wallets[0].logo', height='30')
          span {{ $t('Get') }} {{ $t(wallets[0].name) }}
    .divider
      span.line
      .text {{ $t("Create Account") }}
      span.line
    .items(v-if='wallets[0]')
      .item(v-if="network.name == 'wax'")
        AlcorButton.button(alternative, @click='openInNewTab(wallets[1].create)')
          img.mr-2(:src='wallets[1].logo', height='30')
          .details
            span {{ $t('Get') }} {{ $t(wallets[1].name) }}
            span.description From Wax Team
      .item(v-if="network.name != 'ultra'")
        AlcorButton.button(alternative, @click='openInNewTab(wallets[wallets.length - 1].create)')
          img.mr-2(:src='require(`@/assets/logos/wombat_${this.$colorMode.value}.png`)', height='30')
          .details
            span Wombat Wallet
            span.description From Wombat Team
      .item
        AlcorButton.button(alternative, @click='openInNewTab("https://create.anchor.link/create?return_url=https%3A%2F%2Funicove.com%2F&scope=unicove")')
          img.mr-2(:src='wallets[0].logo', height='30')
          .details
            span {{ $t('Antelope Account Creator') }}
            span.description {{ $t('From Greymass Team') }}
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
    ...mapState('modal', ['context']),

    wallets() {
      const chain = this.context?.chain ? this.context.chain : this.network.name

      const wallets = []

      if (this.network.name == 'ultra' || this.context?.chain == 'ultra') {
        wallets.push({
          id: 'ultra',
          name: 'Ultra Wallet',
          logo: require('@/assets/icons/ultra.png'),
          create: 'https://developers.ultra.io/products/ultra-wallet/'
        })
      }

      wallets.push({
        id: 'anchor',
        name: 'Anchor',
        logo: require('@/assets/logos/anchor.svg'),
        create: 'https://greymass.com/en/anchor'
      })

      if (this.network.name == 'proton' || this.context?.chain == 'proton') {
        wallets.push({
          id: 'proton',
          name: 'WebAuth',
          logo: require('@/assets/icons/proton.png'),
          create: 'https://www.protonchain.com/wallet/'
        })
      }

      if (chain == 'wax') {
        wallets.push({
          id: 'wcw',
          name: 'Wax Cloud Wallet',
          logo: require('@/assets/logos/wax.svg'),
          index: 'wax',
          create: 'https://www.mycloudwallet.com/signin#create-account'
        })
      }

      if (['wax', 'eos', 'telos', 'proton'].includes(chain)) {
        wallets.push({
          id: 'wombat',
          name: 'Wombat Wallet',
          logo: require(`@/assets/logos/wombat_${this.$colorMode.value}.png`),
          create:
            'https://help.wombat.app/'
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
  max-width: 840px;
  width: 100%;

  .item {
    width: 50%;
    padding: 6px;
    .details {
      flex: 1;
      .description {
        color: var(--text-disable);
        font-size: 12px;
      }
    }
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
