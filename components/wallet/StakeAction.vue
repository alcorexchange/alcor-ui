<template lang="pug">
.el-card.resource-page-card
    .header
        i.el-icon-present
        span.text Stake
    .main
      .input-label
        .dot.green
        span CPU Stake Amount
      el-input(v-model="CPU" @change="toFixed")
        span(slot="suffix").mr-1 {{ network.baseToken.symbol }}
      .percentages-container
        AlcorButton(@click="setCPUpercent(5)") 5%
        AlcorButton(@click="setCPUpercent(10)") 10%
        AlcorButton(@click="setCPUpercent(15)") 15%
        AlcorButton(@click="setCPUpercent(20)") 20%
      .divider
      .input-label
        .dot.red
        span NET Stake Amount
      el-input(v-model="NET" @change="toFixed")
      .percentages-container
        AlcorButton(@click="setNETpercent(5)") 5%
        AlcorButton(@click="setNETpercent(10)") 10%
        AlcorButton(@click="setNETpercent(15)") 15%
        AlcorButton(@click="setNETpercent(20)") 20%
      SSpacer(:high="true")
      .submit
        AlcorButton(@click="submit" v-loading="loading") Stake
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import AlcorButton from '@/components/AlcorButton.vue'
import SSpacer from '@/components/SSpacer.vue'
export default {
  name: 'RewardsCard',
  components: {
    AlcorButton,
    SSpacer
  },
  props: ['isStake'],

  data: () => {
    return {
      CPU: 0,
      NET: 0,

      loading: false
    }
  },

  computed: {
    ...mapState(['user', 'account', 'network']),
    ...mapGetters({
      systemBalance: 'systemBalance'
    })
  },

  methods: {
    setCPUpercent(percent) {
      const balance = (parseFloat(this.systemBalance) / 100) * percent
      this.CPU = balance
      this.toFixed()
    },

    setNETpercent(percent) {
      const balance = (parseFloat(this.systemBalance) / 100) * percent
      this.NET = balance
      this.toFixed()
    },

    toFixed() {
      this.CPU = parseFloat(this.CPU).toFixed(this.network.baseToken.precision)
      this.NET = parseFloat(this.NET).toFixed(this.network.baseToken.precision)
    },

    async submit() {
      const cpu = parseFloat(this.CPU).toFixed(this.$store.state.network.baseToken.precision) + ' ' +
        this.$store.state.network.baseToken.symbol
      const net = Number(this.NET).toFixed(this.$store.state.network.baseToken.precision) + ' ' +
        this.$store.state.network.baseToken.symbol

      this.loading = true
      try {
        await this.$store.dispatch('chain/sendTransaction', [{
          account: 'eosio',
          name: 'delegatebw',
          authorization: [this.user.authorization],
          data: {
            from: this.user.name,
            receiver: this.user.name,
            stake_net_quantity: net,
            stake_cpu_quantity: cpu,
            transfer: false
          }
        }])
        this.$store.dispatch('loadAccountData')
      } catch (e) {
        return this.$notify({
          title: 'Stake Resources',
          message: e.message,
          type: 'error'
        })
      } finally {
        this.loading = false
      }

      this.$notify({ title: 'Stake Resources', message: 'success', type: 'success' })
    }
  }
}
</script>

<style lang="scss" scoped>
.resource-page-card {
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
}
.input-label {
  display: flex;
  align-items: center;
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 8px;
    margin-right: 4px;
    &.red {
      background: var(--main-red);
    }
    &.green {
      background: var(--main-green);
    }
  }
}
.divider {
  margin: 8px 0;
  height: 2px;
  width: 100%;
  background: var(--background-color-base);
}
.el-input {
  margin: 4px 0;
}
.percentages-container {
  display: flex;
  .alcor-button {
    flex: 1;
    margin: 4px;
    font-size: 0.9rem;
    padding: 4px;
    &:first-child {
      margin-left: 0;
    }
    &:last-child {
      margin-right: 0;
    }
  }
}
.submit {
  .alcor-button {
    width: 100%;
    border-radius: 10px;
    padding: 14px 10px;
  }
}
</style>
