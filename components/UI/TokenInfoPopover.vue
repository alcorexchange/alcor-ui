<template lang="pug">
ElTooltip(placement="top" :openDelay="400" popperClass="token-info-popper" :visibleArrow="false")
  template(#content)
    .token-info-popover-content
      .header
        TokenImage(:src="$tokenLogo(symbol, contract)" height="24")
        .symbol {{ symbol }}
        .contract.disable ( {{ contract }} )
      .usd-price.fs-18.mt-3 ${{ usdPrice }}
      .actions.mt-3
        AlcorButton.action(access @click="toAnalytics")
          span Analytics
          i.el-icon-data-analysis
  div(style="display: inline-flex")
    slot
</template>

<script>
import TokenImage from '~/components/elements/TokenImage'
import AlcorButton from '~/components/AlcorButton'

export default {
  name: 'TokenInfoPopover',
  components: {
    TokenImage,
    AlcorButton,
  },
  props: ['symbol', 'contract'],
  computed: {
    usdPrice() {
      const id = `${this.symbol?.toLowerCase()}-${this.contract}`
      return this.$getToken(id)?.usd_price.toFixed(10)
    },
  },
  methods: {
    toAnalytics() {
      const id = `${this.symbol?.toLowerCase()}-${this.contract}`
      this.$router.push(this.localeRoute(`/analytics/tokens/${id}`))
    },
  },
}
</script>

<style lang="scss">
.token-info-popper {
  font-size: 16px;
  padding: 14px !important;
  box-shadow: 0 0 0 1px rgba(100, 100, 100, 0.1), var(--dropdown-shadow);
  .token-info-popover-content {
    .header {
      display: flex;
      gap: 6px;
      align-items: center;
      .symbol {
        line-height: 1;
      }
    }
    .actions {
      margin: auto;
      .action {
        width: 100%;
      }
    }
  }
}
</style>
