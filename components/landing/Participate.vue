<template lang="pug">
  .participate
    SectionTitle Participate in the protocol
    .text Alcor DAO
    .main
        .left
            .left-inner
                .item
                    .circle
                    .details
                        span.title Governance
                        span.desc Governance
                .item
                    .circle
                    .details
                        span.title Governance
                        span.desc Governance
        .right
            .tab-bar
                .item.active
                    span Allocation
                    span.line
                .item
                    span Release schedule
                    span.line
            SSpacer
            .tab Graph goes here
</template>

<script>
import SectionTitle from '@/components/landing/SectionTitle'
import SSpacer from '@/components/SSpacer'
export default {
  name: 'ChainTools',
  components: {
    SectionTitle,
    SSpacer
  },
  data: () => ({})
}
</script>

<style scoped lang="scss">
.participage {
  background: rgba(32, 32, 32, 0.3);
  backdrop-filter: blur(55px);
  display: flex;
}
.text {
  font-size: 2rem;
  margin-bottom: 10px;
}
.main {
  display: flex;
}
.left {
  width: 33.3333%;
  .left-inner {
    margin-right: 20px;
    display: flex;
    flex-direction: column;
  }
  .item {
    padding: 8px;
    padding-bottom: 60px;
    display: flex;
    border-radius: 12px;
  }
  .circle {
    background: linear-gradient(59.68deg, #486cf7 13.07%, #fb3155 106.57%);
    border-radius: 50%;
    width: 32px;
    height: 32px;
  }
  .details {
    margin-left: 8px;
    display: flex;
    flex-direction: column;
    .title {
      font-size: 1.1rem;
    }
    .desc {
      color: var(--text-grey-thirdly);
    }
  }
}
.right {
  width: 66.66666%;
  .tab-bar {
    display: flex;
  }
  .item {
    padding: 4px 8px;
    color: var(--text-grey-thirdly);
    display: flex;
    flex-direction: column;
    .line {
      background: var(--text-grey-thirdly);
      height: 0;
      border-radius: 4px;
      transition: height 0.4s;
    }
    &.active {
      color: var(--text-default);
      .line {
        height: 2px;
      }
    }
  }
}
</style>
