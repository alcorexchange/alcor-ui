<template lang="pug">
.chain-tools
  SectionTitle.section-title Multi-Chain tools
  .items
    .item(v-for='{ icon, name, description } in chainTools')
      nuxt-link.item-inner(to="/")
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

<style scoped lang="scss">
.section-title {
  margin-bottom: 25px !important;
}
.items {
  display: flex;
  justify-content: space-between;
  .item-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 210px;
    width: 220px;
    border: 1px solid #545454;
    border-radius: 24px;
    background: rgba(40, 40, 40, 0.3);
    backdrop-filter: blur(50px);
    transition: all 0.3s;
    &:hover {
      transform: translateY(-4px);
      box-shadow: var(--card-shadow);
    }
    .icon-container {
      width: 60px;
      height: 60px;
      background: #111111;
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
</style>
