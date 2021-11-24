<template lang="pug">
el-dialog(
  title='Network Resources',
  :visible='isActive',
  @close='close',
  width='50%',
  :append-to-body='true'
)
    div
        .title You are low on CPU! Need more resources?
        .desc Stake {{ $store.state.network.baseToken.symbol }}. You can unstake your {{ $store.state.network.baseToken.symbol }} at any time.
        .progresses
            .progress-continaer
                el-progress(:percentage="getPercentage('cpu_limit')" :width="100" type="circle" :color="generateColor(getPercentage('cpu_limit'))")
                .details
                    .title CPU
                    .total Total Staked: {{totalResources.cpu_weight}}
            .progress-continaer
                el-progress(:percentage="getPercentage('net_limit')" :width="100" type="circle" :color="generateColor(getPercentage('net_limit'))")
                .details
                    .title NET
                    .total Total Staked: {{totalResources.net_weight}}
            //.progress-continaer
                el-progress(:percentage="0" :width="100" type="circle" :color="generateColor(0)")
                .details
                    .title RAM
                    .total Total Staked: // not set
        .add-resources
            el-select.select(v-model="selectedResource")
                el-option(
                  v-for="{name} in resources"
                  :Label="name"
                  :value="name"
                  :id="name"
                  :key="name"
                )
            el-input.input(v-model="amount" :placeholder="'Amount Of' + $store.state.network.baseToken.symbol")
            AlcorButton(@click="submit") Stake
</template>

<script>
import { mapMutations, mapGetters, mapState } from 'vuex'
import AlcorButton from '@/components/AlcorButton.vue'

export default {
  components: {
    AlcorButton
  },
  data: () => ({
    resources: [{ name: 'CPU' }, { name: 'NET' }, { name: 'RAM' }],
    selectedResource: 'CPU',
    amount: 0.0
  }),
  computed: {
    // netPercentage() {
    //   if (!this.account) return
    //   const total = this.account.cpu_limit.max
    //   const used = this.account.cpu_limit.used
    //   console.log((used / total) * 100)
    //   return parseInt((used / total) * 100)
    // },
    totalResources() {
      return this.account ? this.account.total_resources : {}
    },
    ...mapGetters({
      isActive: 'resources/isActive',
      user: 'user'
    }),
    ...mapState({
      account: 'account'
    })
  },
  methods: {
    getPercentage(resource) {
      if (!this.account) return
      const total = this.account[resource].max
      const used = this.account[resource].used
      return parseInt((used / total) * 100)
    },
    generateColor(value) {
      //value from 0 to 100
      const hue = ((1 - value * 0.01) * 120).toString(10)
      return ['hsl(', hue, ',100%,40%)'].join('')
    },
    async submit() {
      const amount = parseFloat(this.amount).toFixed(this.$store.state.network.baseToken.precision) + ' ' +
        this.$store.state.network.baseToken.symbol
      const amount_zero = Number(0).toFixed(this.$store.state.network.baseToken.precision) + ' ' +
        this.$store.state.network.baseToken.symbol

      await this.$store.dispatch('chain/sendTransaction', [{
        account: 'eosio',
        name: 'delegatebw',
        authorization: [this.user.authorization],
        data: {
          from: this.user.name,
          receiver: this.user.name,
          stake_net_quantity: this.selectedResource == 'CPU' ? amount_zero : amount,
          stake_cpu_quantity: this.selectedResource == 'CPU' ? amount : amount_zero,
          transfer: false
        }
      }])

      this.close()
    },

    ...mapMutations({
      close: 'resources/CLOSE'
    })
  }
}
</script>

<style lang="scss" scoped>
.title {
  font-weight: bold;
  text-align: center;
  font-size: 1.2rem;
  margin-bottom: 4px;
}
.desc {
  text-align: center;
}
.progresses {
  display: flex;
  justify-content: center;
  margin: 8px 0;
  flex-wrap: wrap;
}
.progress-continaer {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 8px;
  > * {
    margin-top: 4px;
  }
}
.add-resources {
  display: flex;
  align-items: center;
  margin: auto;
  margin-top: 8px;
  max-width: 400px;
  .select {
    width: 80px;
  }
  .input {
    flex: 1;
    margin: 0 8px;
  }
}
@media only screen and (max-width: 640px) {
  .title {
    font-size: 1.08rem;
  }
  .add-resources {
    .input {
      margin: 0 4px;
    }
  }
}
</style>
