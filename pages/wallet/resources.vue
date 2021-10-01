<template lang="pug">
.resources-page
  .resources-container(v-if="account")
    .resource-item-container
      .el-card.resource-item
          span.title.fwr Ram
          el-progress(:percentage="ramPercent" :width="154" type="circle" color="#486CF6" :stroke-width="32" stroke-linecap="butt")
          .details
              .amount.cancel {{ ramUsageKB }} KB / {{ ramQuotaKB }} KB
              .staked
                  span.cancel Staked:&nbsp;
                  span.fwr {{ (ramUsageKB * ram_price).toFixed(4) }} WAX
    .resource-item-container
      .el-card.resource-item
          span.title.fwr CPU
          el-progress(:percentage="cpuPercent" :width="154" type="circle" color="#66C167" :stroke-width="32" stroke-linecap="butt")
          .details
              .amount.cancel {{ ramUsageKB }} ms / {{ ramQuotaKB }} ms
              .staked
                  span.cancel Staked:&nbsp;
                  span.fwr {{ account.total_resources.cpu_weight }}
    .resource-item-container
      .el-card.resource-item
          span.title.fwr NET
          el-progress(:percentage="netPercent" :width="154" type="circle" color="#FB3155" :stroke-width="32" stroke-linecap="butt")
          .details
              .amount.cancel {{ account.net_limit.used / 1000 }} kb / {{ account.net_limit.available / 1000 }} kb
              .staked
                  span.cancel Staked:&nbsp;
                  span.fwr {{ account.total_resources.net_weight }}
  .rewards-and-actions
    .rewards-card
      RewardsCard
    .actions-container
      .action-item
        StakeAction
      .action-item
        UnstakeAction
  SSpacer(:high="true")
  //Validators
  //SSpacer(:high="true")
  //Proxies
</div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import ResourceItem from '@/components/wallet/ResourceItem.vue'
import RewardsCard from '@/components/wallet/RewardsCard.vue'
import StakeAction from '@/components/wallet/StakeAction.vue'
import UnstakeAction from '@/components/wallet/UnstakeAction.vue'
import Validators from '@/components/wallet/Validators.vue'
import Proxies from '@/components/wallet/Proxies.vue'
import SSpacer from '@/components/SSpacer.vue'
export default {
  name: 'NFTs',
  components: {
    ResourceItem,
    RewardsCard,
    StakeAction,
    UnstakeAction,
    Validators,
    Proxies,
    SSpacer
  },

  data: () => ({
    search: '',
    ram_price: 0
  }),

  computed: {
    ...mapState(['account', 'user']),

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
      console.log(this.account)
      return Math.round((this.account.cpu_limit.used * 100) / this.account.cpu_limit.max)
    },

    netPercent() {
      return Math.round((this.account.net_limit.used * 100) / this.account.net_limit.max)
    }
  },

  watch: {
    user() {
      // TODO Do it in a better way
      const strokes = document.getElementsByClassName('el-progress-circle__track')

      for (const s of strokes) {
        s.setAttribute('stroke', '#333333')
      }
    },

    account() {
      // TODO Do it in a better way
      const strokes = document.getElementsByClassName('el-progress-circle__track')

      for (const s of strokes) {
        s.setAttribute('stroke', '#333333')
      }
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
  }
}
</script>

<style lang="scss">
.resources-page {
  // Custom
}
</style>

<style scoped lang="scss">
.resources-container, .rewards-and-actions, .actions-container{
  display: flex;
  flex-wrap: wrap;
}
.resource-item-container {
  padding: 20px;
  flex: 1;
  &:first-child {
    padding-left: 0;
  }
  &:last-child {
    padding-right: 0;
  }

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
.rewards-card{
  width: 33.3333%;
}
.actions-container{
  flex: 1;
}
.action-item{
  width: 50%;
}
.rewards-card{
  padding: 20px;
  padding-left: 0;
}
.action-item{
  padding: 20px;
  &:last-child {
    padding-right: 0;
  }
}
</style>
