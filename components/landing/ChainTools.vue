<template lang="pug">
  .chain-tools
    SectionTitle Multi-Chain tools
    .items
      .item(v-for="{icon, name, description} in chainTools")
        .item-inner
          .icon-container
            img(:src="icon").icon
          .h3 {{name}}
          .desc {{description}}
</template>

<script>
import SectionTitle from '@/components/landing/SectionTitle'
export default {
  name: 'ChainTools',
  components: {
    SectionTitle
  },
  data: () => ({
    chainTools: [
      {
        icon: require('~/assets/icons/ArrowsDownUp.svg'),
        name: 'AMM Swap',
        description: 'Cross-Chain DEX'
      },
      {
        icon: require('~/assets/icons/ArrowsDownUp.svg'),
        name: 'AMM Swap',
        description: 'Cross-Chain DEX'
      },
      {
        icon: require('~/assets/icons/ArrowsDownUp.svg'),
        name: 'AMM Swap',
        description: 'Cross-Chain DEX'
      },
      {
        icon: require('~/assets/icons/ArrowsDownUp.svg'),
        name: 'AMM Swap',
        description: 'Cross-Chain DEX'
      }
    ]
  })
}
</script>

<style scoped lang="scss">
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
    }
    .desc {
      color: var(--text-grey-thirdly);
    }
  }
}
</style>
