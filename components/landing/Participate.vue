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
                .item(@click="setActiveTab('allocation')" :class="{active: activeTab === 'allocation'}")
                    span Allocation
                    span.line
                .item(@click="setActiveTab('release')" :class="{active: activeTab === 'release'}")
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
  data: () => ({
    activeTab: 'allocation'
  }),
  methods: {
    setActiveTab(tab) {
      this.activeTab = tab
    }
  }
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
    cursor: pointer;
    .line {
      background: var(--text-grey-thirdly);
      height: 2px;
      border-radius: 4px;
      opacity: 0;
      transition: opacity 0.2s;
    }
    &.active {
      color: var(--text-default);
      .line {
        opacity: 1;
      }
    }
  }
}
@media only screen and (max-width: 840px) {
  .main {
    flex-direction: column;
  }
  .left {
    width: 100%;
    .left-inner {
      flex-direction: row;
      margin-right: 0;
      width: 100%;
      .item {
        width: 50%;
      }
    }
  }
  .right {
    width: 100%;
  }
}
@media only screen and (max-width: 840px) {
  .text {
    padding: 0 8px;
  }
}
@media only screen and (max-width: 540px) {
  .left {
    width: 100%;
    .left-inner {
      flex-direction: column;
      .item {
        width: 100%;
      }
    }
  }
}
</style>
