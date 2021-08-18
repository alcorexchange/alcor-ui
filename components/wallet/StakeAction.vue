<template lang="pug">
.el-card.resource-page-card
    .header
        i.el-icon-present
        span.text {{renderType}}
    .main
      .input-label
        .dot.green
        span CPU {{renderType}} Amount
      el-input
      .percentages-container
        AlcorButton 25%
        AlcorButton 50%
        AlcorButton 75%
        AlcorButton 100%
      .divider
      .input-label
        .dot.red
        span NET {{renderType}} Amount
      el-input
      .percentages-container
        AlcorButton 25%
        AlcorButton 50%
        AlcorButton 75%
        AlcorButton 100%
      SSpacer(:high="true")
      .submit
        AlcorButton {{renderType}}
</template>

<script>
import AlcorButton from '@/components/AlcorButton.vue'
import SSpacer from '@/components/SSpacer.vue'
export default {
  name: 'RewardsCard',
  components: {
    AlcorButton,
    SSpacer
  },
  props: ['isStake'],
  computed: {
    renderType() {
      return this.isStake ? 'Stake' : 'Unstake'
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
