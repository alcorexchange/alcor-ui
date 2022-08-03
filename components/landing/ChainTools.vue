<template lang="pug">
.chain-tools
  SectionTitle.section-title {{ $t('ONCHAIN_TOOLS_TITLE') }}
  .items
    .item(v-for='{ icon, name, description, to } in chainTools')
      nuxt-link.item-inner(:to="localePath(to, $i18n.locale)")
        .icon-container
          img.icon(:src='icon')
        .h3 {{ $t(name) }}
        .desc {{ $t(description) }}
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
        description: 'With Pair Creation',
        to: '/swap'
      },
      {
        icon: require('~/assets/icons/ArrowsDownUp.svg'),
        name: 'Spot Trading',
        description: 'Limit & Market',
        to: '/markets'
      },
      {
        icon: require('~/assets/icons/ChartLineUp.svg'),
        name: 'Earn',
        description: 'Providing Liquidity',
        to: '/swap'
      },
      {
        icon: require('~/assets/icons/Image.svg'),
        name: 'NFT',
        description: 'Multiple Protocols',
        to: '/nft-market'
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

    backdrop-filter: blur(7px);

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
      background-color: var(--hover);
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
      text-align: center;
    }
  }
}

@media only screen and (max-width: 940px) {
  .items {
    justify-content: center;
    gap: 20px;

  }
}

@media only screen and (max-width: 640px) {
  .items {
    gap: 20px;

    .item {
      width: 154px;
      height: 142px;

      .item-inner {
        width: 100%;
        height: 100%;
        border-radius: 12px;


        .h3 {
          font-size: 19px;
        }

        .desc {
          font-size: 14px;
        }

        .icon-container {
          width: 42px;
          height: 42px;

          .icon {
            width: 24px;
            height: 24px;
          }

        }
      }
    }
  }
}
</style>
