<template lang="pug">
.pending-unstake
  .fs-18.pt-3.pb-2.disable My Pending Unstakes
  template(v-if="unstakes?.length")
    ElAlert.mb-4(:closable="false")
      template(#title) Requests are typically processed within one day. If the contract lacks sufficient funds, please allow 3 to 6
        |  days for replenishment. Funds will automatically be sent to {{ user?.name ?? 'your account' }}; no need to claim them.
    .items.px-1
      .item(v-for="item in unstakes")
        .header.pb-1.fs-14.disable
          .date {{ item.request_time | moment('MM-DD HH:mm') }}
          .id # {{ item.id }}
        .content
          .section
            .section-type.disable.pb-1.fs-14 Pending
            .section-amount
              TokenImage(:src="$tokenLogo(item.withdrawToken.quantity.split(' ')[1], item.withdrawToken.contract)" height="20")
              .amount {{ item.withdrawToken.quantity.split(' ')[0] }}
              .symbol.fs-14.disable {{ item.withdrawToken.quantity.split(' ')[1] }}
          .section
            .section-type.disable.pb-1.fs-14 Burned
            .section-amount
              TokenImage(:src="$tokenLogo(item.requestToken.quantity.split(' ')[1], item.requestToken.contract)" height="20")
              .amount {{ item.requestToken.quantity.split(' ')[0] }}
              .symbol.fs-14.disable {{ item.requestToken.quantity.split(' ')[1] }}
  .no-items.disable(v-else)
    i.el-icon-moon-night
    div.fs-14 Your pending unstakes will be shown here.
</template>

<script>
import TokenImage from '@/components/elements/TokenImage'
import { mapGetters } from 'vuex'

export default {
  name: 'PendingUnstake',
  components: {
    TokenImage,
  },
  props: ['unstakes'],
  computed: {
    ...mapGetters(['user']),
  },
}
</script>

<style scoped lang="scss">
.items {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-height: 400px;
  overflow: auto;
  .item {
    display: flex;
    flex-direction: column;
    .header {
      display: flex;
      justify-content: space-between;
    }
    .content {
      display: flex;
      justify-content: space-between;
      gap: 10px;
    }
    .section {
      display: flex;
      flex-direction: column;
      .section-title {
        padding-bottom: 4px;
      }
      .section-amount {
        display: flex;
        align-items: center;
        gap: 4px;
      }
    }
  }
}
.no-items {
  padding: 28px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  i {
    font-size: 2rem;
  }
}
</style>
