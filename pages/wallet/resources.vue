<template lang="pug">
.resources-page
  .resources-container(v-if="account")
    .resource-item-container
      .el-card.resource-item
        span.title.fwr CPU
        alcor-progress(:percentage="cpuPercent" :width="154" type="circle" background="var(--bg-alter-2)" color="#66C167" :stroke-width="32" stroke-linecap="butt")
        .details.w-100.text-center
          .amount.cancel {{ cpuFraction }}
          .staked
            span.cancel {{ $t('Staked') }}:&nbsp;
            span.fwr {{ account.total_resources.cpu_weight }}
          .d-flex.gap-16.justify-content-center.mt-3
            alcor-button.w-100(access @click="openCPUStakePopup") {{ $t('Stake') }}
            alcor-button(@click="openCPUUnStakePopup") {{ $t('Unstake') }}

    .resource-item-container
      .el-card.resource-item
        span.title.fwr NET
        alcor-progress(:percentage="netPercent" :width="154" type="circle" background="var(--bg-alter-2)" color="#FB3155" :stroke-width="32" stroke-linecap="butt")
        .details.w-100.text-center
          .amount.cancel {{ netFraction }}
          .staked
            span.cancel {{ $t('Staked') }}:&nbsp;
            span.fwr {{ account.total_resources.net_weight }}
          .d-flex.gap-16.justify-content-center.mt-3
            alcor-button.w-100(access @click="openNETStakePopup") Stake
            alcor-button(@click="openNETUnStakePopup") Unstake

    .resource-item-container
      .el-card.resource-item
        span.title.fwr Ram
        alcor-progress(:percentage="ramPercent" :width="154" type="circle" background="var(--bg-alter-2)" color="#486CF6" :stroke-width="32" stroke-linecap="butt")
        .details.w-100.text-center
          .amount.cancel {{ ramFraction }}
          .staked
            span.cancel {{ $t('Staked') }}:&nbsp;
            span.fwr {{ ramStakedAmount }}
          .d-flex.gap-16.justify-content-center.mt-3
            alcor-button.flex-grow-1(@click="openRAMBuyPopup") Buy RAM
            alcor-button.flex-grow-1(@click="openRAMSellPopup") Sell RAM

  .rewards-and-actions
    RewardsCard
    //- .actions-container
    //.action-item
      StakeAction
    //.action-item
      UnstakeAction
  SSpacer(:high="true")
  Validators
  //SSpacer(:high="true")
  //Proxies
  //- STALE/BUY POPUP
  el-dialog.staking-dialog(
    :title="stakePopup.title"
    :visible="stakePopup.active"
    @close="stakePopup.active = false"
  )
    .row
      .col.d-flex.flex-column.align-items-start.gap-16
        .fs-14.disable {{ stakePopup.receiverTitle }}
        el-input(v-model="receiverOfStake")
        .fs-14.disable {{ stakePopup.amountTitle }}
        el-input(v-model="amount" @input="onAmountUpdate")
          .mr-1(slot='suffix') {{ $store.state.network.name }}
        .d-flex.align-items-center.gap-24.w-100
          el-slider(
            :step='1',
            v-model='amountPercent',
            @change="onPercentUpdate"
            :marks='{ 0: "0%", 25: "25%", 50: "50%", 75: "75%", 100: "100%" }'
            :show-tooltip="false"
          ).slider-buy.w-100.px-2
          .w-40
            el-input.percent(size="mini" v-model.number="amountPercent", @input="onPercentUpdate")
              el-button(slot='suffix' size="mini") %

        .w-100.text-center.mt-3
          .amount.cancel {{ stakePopup.amount }}
          .staked
            span.cancel {{ $t('Staked') }}:&nbsp;
            span.fwr {{ stakePopup.staked }}

        alcor-button.w-100(access big @click="onStake(stakePopup.stakeType, stakePopup.stakeType === 'RAM' ? 'buyram' : 'delegatebw')") {{ $t('Stake') }}

  //- UNSTAKE/SELL POPUP
  el-dialog.staking-dialog(
    :title="unstakePopup.title"
    :visible="unstakePopup.active"
    @close="unstakePopup.active = false"
  )
    .row
      .col.d-flex.flex-column.align-items-start.gap-16
        .fs-14.disable {{ unstakePopup.amountTitle }}
        el-input(v-model="amount" @input="onUnstakeAmountUpdate($event, unstakePopup.unstakeType)")
          .mr-1(slot='suffix') {{ unstakePopup.amountTag || network.name }}
        .d-flex.align-items-center.gap-24.w-100
          el-slider(
            :step='1',
            v-model='amountPercent',
            @change="onUnstakePercentUpdate($event, unstakePopup.unstakeType)"
            :marks='{ 0: "0%", 25: "25%", 50: "50%", 75: "75%", 100: "100%" }'
            :show-tooltip="false"
          ).slider-buy.w-100.px-2
          .w-40
            el-input.percent(size="mini" v-model.number="amountPercent", @input="onUnstakePercentUpdate($event, unstakePopup.unstakeType)")
              el-button(slot='suffix' size="mini") %

        .w-100.text-center.mt-3
          .amount.cancel {{ unstakePopup.amount }}
          .staked
            span.cancel {{ unstakePopup.unstakeType === 'RAM' ? 'Available' : 'Staked'  }}:&nbsp;
            span.fwr {{ unstakePopup.staked }}

        alcor-button.w-100(
          big
          @click="onStake(unstakePopup.unstakeType, unstakePopup.unstakeType === 'RAM' ? 'sellram' : 'undelegatebw')"
        ) {{ $t('Unstake') }}
</template>

<script>
import { mapState } from 'vuex'
import ResourceItem from '@/components/wallet/ResourceItem.vue'
import RewardsCard from '@/components/wallet/RewardsCard.vue'
import StakeAction from '@/components/wallet/StakeAction.vue'
import UnstakeAction from '@/components/wallet/UnstakeAction.vue'
import Validators from '@/components/wallet/Validators.vue'
import Proxies from '@/components/wallet/Proxies.vue'
import SSpacer from '@/components/SSpacer.vue'
import AlcorButton from '~/components/AlcorButton'

import AlcorProgress from '~/components/alcor-element/progress'

export default {
  name: 'Resources',
  components: {
    ResourceItem,
    RewardsCard,
    StakeAction,
    UnstakeAction,
    Validators,
    Proxies,
    SSpacer,
    AlcorProgress,
    AlcorButton
  },

  data: () => ({
    search: '',
    cpuUnstake: false,
    netUnstake: false,
    percentStake: 0,
    receiver: null,
    ramCost: 0,
    amount: 0,
    amountPercent: 0,
    stakePopup: {
      active: false,
      title: '',
      receiverTitle: 'Receiver of Stake',
      amountTitle: '',
      stakeType: 'CPU', // | 'NET' | 'RAM'
      amount: '',
      staked: ''
    },
    unstakePopup: {
      active: false,
      title: '',
      amountTitle: '',
      amountTag: '',
      unstakeType: 'CPU', // | 'NET' | 'RAM'
      amount: '',
      staked: ''
    }
  }),

  computed: {
    ...mapState(['account', 'user', 'network']),

    baseTokenBalance() {
      const baseToken = this.$store.state.network.baseToken
      return this.$tokenBalance(baseToken.symbol, baseToken.contract)
    },

    receiverOfStake: {
      get() {
        return this.receiver != null ? this.receiver : this.$store.state.user.name
      },
      set(v) {
        this.receiver = v
      }
    },

    ramPercent() {
      return Math.round((this.account.ram_usage * 100) / this.account.ram_quota)
    },

    ramQuotaKB() {
      return this.account.ram_quota / 1000
    },

    ramUsageKB() {
      return this.account.ram_usage / 1000
    },
    ramFraction() {
      return `${this.ramUsageKB} KB / ${this.ramQuotaKB} KB`
    },

    ramStakedAmount() {
      return `${(this.ramCost * this.account.total_resources.ram_bytes).toFixed(this.network.baseToken.precision)} ${this.network.baseToken.symbol}`
    },

    cpuPercent() {
      return Math.round((this.account.cpu_limit.used * 100) / this.account.cpu_limit.max)
    },

    cpuFraction() {
      return `${this.account.cpu_limit.used / 1000} ms / ${this.account.cpu_limit.max / 1000} ms`
    },

    netPercent() {
      return Math.round((this.account.net_limit.used * 100) / this.account.net_limit.max) || 0
    },

    netFraction() {
      return `${this.account.net_limit.used / 1000} KB / ${this.account.net_limit.max / 1000} KB`
    }
  },

  mounted() {
    this.init()
  },

  methods: {
    async init() {
      const { rows: [{ base, quote }] } = await this.$rpc.get_table_rows({
        code: 'eosio',
        scope: 'eosio',
        table: 'rammarket',
        limit: 1
      })
      this.ramCost = (parseFloat(quote.balance) / parseFloat(base.balance)) * 1.005
    },
    onAmountUpdate(e) {
      this.amountPercent = parseFloat(((e / this.baseTokenBalance) * 100).toFixed(2))
    },
    onPercentUpdate(e) {
      if (!e) this.amountPercent = 0
      if (parseInt(e) > 100) e = 100
      this.amount = parseFloat((this.baseTokenBalance * (parseInt(e) / 100)).toFixed(this.network.baseToken.precision)) || 0
    },

    onUnstakeAmountUpdate(e, type) {
      let max
      if (type === 'CPU') max = parseFloat(this.account.total_resources.cpu_weight)
      else if (type === 'NET') max = parseFloat(this.account.total_resources.net_weight)
      // TODO: Check
      else if (type === 'RAM') max = this.account.ram_quota - this.account.ram_usage

      this.amountPercent = parseFloat(((e / max) * 100).toFixed(2))
    },
    onUnstakePercentUpdate(e, type) {
      let max
      if (type === 'CPU') max = parseFloat(this.account.total_resources.cpu_weight)
      else if (type === 'NET') max = parseFloat(this.account.total_resources.net_weight)
      // TODO: Check
      else if (type === 'RAM') max = this.account.ram_quota - this.account.ram_usage

      if (!e) this.amountPercent = 0
      if (parseInt(e) > 100) e = 100
      this.amount = parseFloat((max * (parseInt(e) / 100)).toFixed(this.network.baseToken.precision)) || 0
    },

    // STAKE POPUPS
    openCPUStakePopup() {
      this.stakePopup = {
        active: true,
        title: 'CPU Staking',
        receiverTitle: 'Receiver of Stake',
        amountTitle: 'CPU Stake Amount',
        stakeType: 'CPU',
        amount: this.cpuFraction,
        staked: this.account.total_resources.cpu_weight
      }
    },
    openNETStakePopup() {
      this.stakePopup = {
        active: true,
        title: 'NET Staking',
        receiverTitle: 'Receiver of Stake',
        amountTitle: 'NET Stake Amount',
        stakeType: 'NET',
        amount: this.netFraction,
        staked: this.account.total_resources.net_weight
      }
    },
    openRAMBuyPopup() {
      this.stakePopup = {
        active: true,
        title: 'Buy RAM',
        receiverTitle: 'Receiver of Stake',
        amountTitle: 'RAM Buy Amount',
        stakeType: 'RAM',
        amount: this.ramFraction,
        staked: this.ramStakedAmount
      }
    },

    // UNSTAKE POPUPS
    openCPUUnStakePopup() {
      this.unstakePopup = {
        active: true,
        title: 'CPU Unstake',
        amountTitle: 'CPU Unstake Amount',
        unstakeType: 'CPU',
        amount: this.cpuFraction,
        staked: this.account.total_resources.cpu_weight
      }
    },
    openNETUnStakePopup() {
      this.unstakePopup = {
        active: true,
        title: 'NET Unstake',
        amountTitle: 'NET Unstake Amount',
        unstakeType: 'NET',
        amount: this.netFraction,
        staked: this.account.total_resources.net_weight
      }
    },
    openRAMSellPopup() {
      this.unstakePopup = {
        active: true,
        title: 'Sell RAM',
        amountTitle: 'RAM (bytes)',
        unstakeType: 'RAM',
        amountTag: 'bytes',
        amount: this.ramFraction,
        staked: `${this.account.ram_quota - this.account.ram_usage} Bytes`
      }
    },

    async onStake(type = 'CPU', actionName) {
      const baseToken = this.network.baseToken
      const amount = actionName === 'sellram'
        ? parseInt(this.amount) // bytes of RAM
        : `${parseFloat(this.amount).toFixed(this.network.baseToken.precision)} ${baseToken.symbol}`
      const zeroAmount = `${Number(0).toFixed(this.network.baseToken.precision)} ${baseToken.symbol}`

      let authorization
      let data

      if (type === 'CPU' || type === 'NET') {
        authorization = [this.user.authorization]
        data = {
          from: this.user.name,
          receiver: this.receiverOfStake,
          [actionName === 'delegatebw' ? 'stake_net_quantity' : 'unstake_net_quantity']: type == 'CPU' ? zeroAmount : amount,
          [actionName === 'delegatebw' ? 'stake_cpu_quantity' : 'unstake_cpu_quantity']: type == 'NET' ? zeroAmount : amount,
          transfer: false
        }
      } else { // RAM
        authorization = [
          {
            actor: this.user.name,
            permission: 'active',
          },
        ]
        data = actionName === 'buyram' ? {
          payer: this.user.name,
          receiver: this.receiverOfStake,
          quant: amount,
        } : {
          account: this.user.name,
          bytes: amount
        }
      }
      console.log({ authorization, data })

      try {
        await this.$store.dispatch('chain/sendTransaction', [{
          account: 'eosio',
          name: actionName,
          authorization,
          data
        }])
        this.stakePopup.active = false
        this.unstakePopup.active = false
        this.init()
      } catch (e) {
        console.log('error on staking / buying RAM', e)
      }
    }
  },
  watch: {
    // Reset amounts on popups close
    'stakePopup.active'(active) {
      if (active) return
      this.amount = 0
      this.amountPercent = 0
    },
    'unstakePopup.active'(active) {
      if (active) return
      this.amount = 0
      this.amountPercent = 0
    },
  }
}
</script>

<style lang="scss">
.percent .el-input__suffix {
  right: 0px;
}

.staking-dialog {
  .el-dialog {
    width: 352px;
  }
}

.resources-page {
  // Custom
}
</style>

<style scoped lang="scss">
.resources-container,
.rewards-and-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 40px;
}

.rewards-and-actions {
  margin-top: 40px;
}

.resource-item-container {
  flex: 1;

  .resource-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 14px;
  }

  .title {
    margin-bottom: 14px;
  }

  .details {
    margin-top: 14px;
  }
}

.action-item,
.rewards-card {
  flex: 1;
}

@media only screen and (max-width: 940px) {

  .resources-container,
  .rewards-and-actions {
    gap: 10px;
  }

  .rewards-and-actions {
    margin-top: 10px;
  }
}

@media only screen and (max-width: 740px) {

  .resources-container,
  .rewards-and-actions {
    flex-direction: column;
    max-width: 400px;
    margin: auto;
  }

  .rewards-and-actions {
    margin-top: 10px;
  }
}
</style>
