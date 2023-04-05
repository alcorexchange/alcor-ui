<template lang="pug">
.resources-page
  .resources-container(v-if="account")
    .resource-item-container
      .el-card.resource-item
        span.title.fwr CPU
        alcor-progress(:percentage="cpuPercent" :width="154" type="circle" background="var(--bg-alter-2)" color="#66C167" :stroke-width="32" stroke-linecap="butt")
        .details.w-100.text-center
          .amount.cancel {{ ramUsageKB }} ms / {{ ramQuotaKB }} ms
          .staked
            span.cancel {{ $t('Staked') }}:&nbsp;
            span.fwr {{ account.total_resources.cpu_weight }}
          .d-flex.gap-16.justify-content-center.mt-3
            alcor-button.w-100(access @click="cpuStake = true") {{ $t('Stake') }}

            el-dialog.staking-dialog(
              title="CPU Staking"
              :visible="cpuStake"
              @close="cpuStake = false"

            )
              .row
                .col.d-flex.flex-column.align-items-start.gap-16
                  .fs-14.disable {{ $t('Receiver of Stake') }}
                  el-input(v-model="receiverOfStake")
                  .fs-14.disable {{ $t('CPU Stake Amount') }}
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
                    .amount.cancel {{ ramUsageKB }} ms / {{ ramQuotaKB }} ms
                    .staked
                      span.cancel {{ $t('Staked') }}:&nbsp;
                      span.fwr {{ account.total_resources.cpu_weight }}

                  alcor-button.w-100(access big) {{ $t('Stake') }}

            alcor-button(@click="cpuUnstake = true") {{ $t('Unstake') }}

            el-dialog.staking-dialog(
              title="CPU Unstake"
              :visible="cpuUnstake"
              @close="cpuUnstake = false"

            )
              .row
                .col.d-flex.flex-column.align-items-start.gap-16
                  .fs-14.disable {{ $t('CPU Unstake Amount') }}
                  el-input
                    .mr-1(slot='suffix') {{ $store.state.network.name }}
                  .d-flex.align-items-center.gap-24.w-100
                    el-slider(
                      :step='1',
                      v-model='percentStake',
                      :marks='{ 0: "0%", 25: "25%", 50: "50%", 75: "75%", 100: "100%" }'
                      :show-tooltip="false"
                    ).slider-buy.w-100.px-2
                    .w-40
                      el-input.percent(size="mini" v-model="percentStake")
                        el-button(slot='suffix' size="mini") %

                  .w-100.text-center.mt-3
                    .amount.cancel {{ ramUsageKB }} ms / {{ ramQuotaKB }} ms
                    .staked
                      span.cancel {{ $t('Staked') }}:&nbsp;
                      span.fwr {{ account.total_resources.cpu_weight }}

                  alcor-button.w-100(big) {{ $t('Unstake') }}


    .resource-item-container
      .el-card.resource-item
        span.title.fwr NET
        alcor-progress(:percentage="netPercent" :width="154" type="circle" background="var(--bg-alter-2)" color="#FB3155" :stroke-width="32" stroke-linecap="butt")
        .details.w-100.text-center
          .amount.cancel {{ account.net_limit.used / 1000 }} kb / {{ account.net_limit.available / 1000 }} kb
          .staked
            span.cancel {{ $t('Staked') }}:&nbsp;
            span.fwr {{ account.total_resources.net_weight }}
          .d-flex.gap-16.justify-content-center.mt-3
            alcor-button.w-100(access @click="netStake = true") Stake

            el-dialog.staking-dialog(
              title="NET Staking"
              :visible="netStake"
              @close="netStake = false"

            )
              .row
                .col.d-flex.flex-column.align-items-start.gap-16
                  .fs-14.disable {{ $t('Receiver of Stake') }}
                  el-input(v-model="receiverOfStake")
                  .fs-14.disable {{ $t('NET Stake Amount') }}
                  el-input
                    .mr-1(slot='suffix') {{ $store.state.network.name }}
                  .d-flex.align-items-center.gap-24.w-100
                    el-slider(
                      :step='1',
                      v-model='percentStake',
                      :marks='{ 0: "0%", 25: "25%", 50: "50%", 75: "75%", 100: "100%" }'
                      :show-tooltip="false"
                    ).slider-buy.w-100.px-2
                    .w-40
                      el-input.percent(size="mini" v-model="percentStake")
                        el-button(slot='suffix' size="mini") %

                  .w-100.text-center.mt-3
                    .amount.cancel {{ account.net_limit.used / 1000 }} kb / {{ account.net_limit.available / 1000 }} kb
                    .staked
                      span.cancel {{ $t('Staked') }}:&nbsp;
                      span.fwr {{ account.total_resources.net_weight }}

                  alcor-button.w-100(access big) {{ $t('Stake') }}

            alcor-button(@click="netUnstake = true") Unstake

            el-dialog.staking-dialog(
              title="NET Unstake"
              :visible="netUnstake"
              @close="netUnstake = false"

            )
              .row
                .col.d-flex.flex-column.align-items-start.gap-16
                  .fs-14.disable {{ $t('NET Unstake Amount') }}
                  el-input
                    .mr-1(slot='suffix') {{ $store.state.network.name }}
                  .d-flex.align-items-center.gap-24.w-100
                    el-slider(
                      :step='1',
                      v-model='percentStake',
                      :marks='{ 0: "0%", 25: "25%", 50: "50%", 75: "75%", 100: "100%" }'
                      :show-tooltip="false"
                    ).slider-buy.w-100.px-2
                    .w-40
                      el-input.percent(size="mini" v-model="percentStake")
                        el-button(slot='suffix' size="mini") %

                  .w-100.text-center.mt-3
                    .amount.cancel {{ account.net_limit.used / 1000 }} kb / {{ account.net_limit.available / 1000 }} kb
                    .staked
                      span.cancel {{ $t('Staked') }}:&nbsp;
                      span.fwr {{ account.total_resources.net_weight }}

                  alcor-button.w-100(big) {{ $t('Unstake') }}


    .resource-item-container
      .el-card.resource-item
        span.title.fwr Ram
        alcor-progress(:percentage="ramPercent" :width="154" type="circle" background="var(--bg-alter-2)" color="#486CF6" :stroke-width="32" stroke-linecap="butt")
        .details.w-100.text-center
          .amount.cancel {{ ramUsageKB }} KB / {{ ramQuotaKB }} KB
          .staked
            span.cancel {{ $t('Staked') }}:&nbsp;
            span.fwr {{ (ramUsageKB * ram_price).toFixed(4) }} WAX
          .d-flex.gap-16.justify-content-center.mt-3
            alcor-button.w-100(@click="buyRam = true") Buy RAM

            el-dialog.staking-dialog(
              title="Buy RAM"
              :visible="buyRam"
              @close="buyRam = false"

            )
              .row
                .col.d-flex.flex-column.align-items-start.gap-16
                  .fs-14.disable {{ $t('Receiver of Stake') }}
                  el-input(v-model="receiverOfStake")
                  .fs-14.disable {{ $t('RAM Buy Amount') }}
                  el-input
                    .mr-1(slot='suffix') {{ $store.state.network.name }}
                  .d-flex.align-items-center.gap-24.w-100
                    el-slider(
                      :step='1',
                      v-model='percentStake',
                      :marks='{ 0: "0%", 25: "25%", 50: "50%", 75: "75%", 100: "100%" }'
                      :show-tooltip="false"
                    ).slider-buy.w-100.px-2
                    .w-40
                      el-input.percent(size="mini" v-model="percentStake")
                        el-button(slot='suffix' size="mini") %

                  .w-100.text-center.mt-3
                    .amount.cancel {{ ramUsageKB }} ms / {{ ramQuotaKB }} ms
                    .staked
                      span.cancel {{ $t('Staked') }}:&nbsp;
                      span.fwr {{ account.total_resources.cpu_weight }}

                  alcor-button.w-100(access big) {{ $t('Buy') }}


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
  name: 'NFTs',
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
    cpuStake: false,
    netStake: false,
    buyRam: false,
    cpuUnstake: false,
    netUnstake: false,
    percentStake: 0,
    receiver: null,
    ram_price: 0,
    amount: 0,
    amountPercent: 0
  }),

  computed: {
    ...mapState(['account', 'user']),

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

    cpuPercent() {
      return Math.round((this.account.cpu_limit.used * 100) / this.account.cpu_limit.max)
    },

    netPercent() {
      return Math.round((this.account.net_limit.used * 100) / this.account.net_limit.max) || 0
    }
  },

  async mounted() {
    const { rows: [{ base, quote }] } = await this.$rpc.get_table_rows({
      code: 'eosio',
      scope: 'eosio',
      table: 'rammarket',
      limit: 1
    })

    this.ram_price = (parseFloat(quote.balance) / parseFloat(base.balance)) * 1024
  },

  methods: {
    onAmountUpdate(e) {
      this.amountPercent = parseFloat(((e / this.baseTokenBalance) * 100).toFixed(2))
    },
    onPercentUpdate(e) {
      if (!e) this.amountPercent = 0
      if (parseInt(e) > 100) e = 100
      this.amount = parseFloat((this.baseTokenBalance * (parseInt(e) / 100)).toFixed(this.$store.state.network.baseToken.precision)) || 0
    }
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
