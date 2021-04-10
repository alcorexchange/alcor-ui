<template lang="pug">
.chain-tools
  SectionTitle.section-title On-Chain Tools
  .items
    .item(v-for='{ icon, name, description } in chainTools')
      nuxt-link.item-inner(to='/')
        .icon-container
          img.icon(:src='icon')
        .h3 {{ name }}
        .desc {{ description }}
  Spacer
</template>

<script>
import SectionTitle from '@/components/landing/SectionTitle'
import Spacer from '@/components/Spacer'
export default {
  name: 'ChainTools',
  components: {
    SectionTitle,
    Spacer
  },
  data: () => ({
    chainTools: [
      {
        icon: require('~/assets/icons/ArrowsClockwise.svg'),
        name: 'AMM Swap',
        description: 'Cross-Chain DEX'
      },
      {
        icon: require('~/assets/icons/ArrowsDownUp.svg'),
        name: 'Spot Trading',
        description: 'Cross-Chain DEX'
      },
      {
        icon: require('~/assets/icons/ChartLineUp.svg'),
        name: 'Earn',
        description: 'Cross-Chain DEX'
      },
      {
        icon: require('~/assets/icons/Image.svg'),
        name: 'Nft',
        description: 'Cross-Chain DEX'
      }
    ]
  })
}
</script>

<style lang="scss" scoped>
.section-title {
  margin-bottom: 25px !important;
}
.items {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  .item-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 210px;
    width: 220px;
    border: 1px solid var(--dark-btn-sm);
    border-radius: 24px;
    background: var(--landing-card-bg);

    backdrop-filter: blur(12px);

    // Trying to improve perfomance for circles
    -webkit-backface-visibility: hidden;
    -webkit-perspective: 1000;
    -webkit-transform: translate3d(0, 0, 0);
    -webkit-transform: translateZ(0);
    backface-visibility: hidden;
    perspective: 1000;
    transform: translate3d(0, 0, 0);
    transform: translateZ(0);
    // Trying to improve perfomance for circles

    transition: all 0.3s;

    &:hover {
      transform: translateY(-4px);
      box-shadow: var(--card-shadow);
    }
    .icon-container {
      width: 60px;
      height: 60px;
      background: var(--landing-icon-bg);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      .icon {
        width: 32px;
        height: 32px;
      }
    }
    .h3 {
      font-size: 1.4rem;
      margin: 10px 0;
      color: var(--text-default);
    }
    .desc {
      color: var(--text-grey-thirdly);
    }
  }
}
@media only screen and (max-width: 940px) {
  .items {
    justify-content: center;
    .item {
      padding: 8px;
    }
  }
}
@media only screen and (max-width: 640px) {
  .items {
    .item {
      width: 100%;
      .item-inner {
        height: 160px;
        border: none !important ;
        width: 100%;
      }
    }
  }
}
</style>
