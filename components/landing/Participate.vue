<template lang="pug">
.participage
  .inner.alcor-inner
    SectionTitle Participate in Protocol
    .text Alcor DAO coming soon..
    .main
        .left
            .left-inner
                .item
                    .circle
                    .details
                        span.title Earn
                        span.desc Alcor Revenue Distribution
                .item
                    .circle
                    .details
                        span.title Governance
                        span.desc Vote for Proposals
        .right
          ParticipateChart
</template>

<script>
import SectionTitle from '@/components/landing/SectionTitle'
import ParticipateChart from '@/components/landing/ParticipateChart'
export default {
  name: 'ChainTools',
  components: {
    SectionTitle,
    ParticipateChart
  }
}
</script>

<style scoped lang="scss">
.participage {
  background: rgba(32, 32, 32, 0.3);
  padding: 28px 0;
  backdrop-filter: blur(55px);
  display: flex;
}
.text {
  font-size: 2rem;
}
.main {
  display: flex;
}
.left {
  width: 33.3333%;
  padding-top: 40px;
  .left-inner {
    margin-right: 40px;
    display: flex;
    flex-direction: column;
  }
  .item {
    padding: 14px;
    padding-bottom: 60px;
    display: flex;
    border-radius: 12px;
    background: var(--bg-alter-1);
    margin-bottom: 14px;
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
