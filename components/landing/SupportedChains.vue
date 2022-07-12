<template lang="pug">
.supported-chains
  .alcor-inner
    SectionTitle.section-title {{ $t('SUPPORTED_UPCOMING_CHAINS_TITLE') }}
    .chains
      img.chain(v-if="$colorMode.value == 'light'" src='~/assets/images/supportedchain-4-dark.svg')
      img.chain(v-else src='~/assets/images/supportedchain-4.svg')
      img.chain(src='~/assets/images/supportedchain-1.svg')
      img.chain(src='~/assets/images/supportedchain-2.svg')
      img.chain(v-if="$colorMode.value == 'light'" src='~/assets/images/supportedchain-3-dark.svg')
      img.chain(v-else src='~/assets/images/supportedchain-3.svg')
      span.more {{ $t('and more...') }}
    .inner-container
      span.title {{ $t('BUILDINGGLOBALCOMMUNITY') }}
      p.text {{ $t('LEARNMORE') }}
      .social-items
        a.item(href="https://t.me/alcorexchange" target="_blank")
          .icon
            img(src='~/assets/icons/Telegram.svg')
          span.name Telegram
          span.desc {{ $t('TRAIDING_TALKS') }}
        a.item(href="https://avral.medium.com/" target="_blank")
          .icon
            img(src='~/assets/icons/Monogram.svg')
          span.name Medium
          span.desc {{ $t('REVIEW_NEWS') }}
        a.item(href="https://github.com/avral/alcor-ui" target="_blank")
          .icon
            img(src='~/assets/icons/Github.svg')
          span.name Github
          span.desc {{ $t('CODE_CONTIBUTE') }}
        a.item(href="https://twitter.com/alcorexchange" target="_blank")
          .icon
            img(src='~/assets/icons/Twitter.svg')
          span.name Twitter
          span.desc {{ $t('ANOUNCEMENT') }}
      span.title {{ $t('PARTNERS_PROVIDERS') }}
      .items
        a.item(v-for="{ image, url, padding } in items" :href="url" target="_blank" :style="{ padding }")
          img(:src="image")
        a(href="https://eosamsterdam.net/")
          EOS(v-if="$colorMode.value == 'dark'")
          img(v-else src='~/assets/images/partners-1.svg')

</template>

<script>
import SectionTitle from '@/components/landing/SectionTitle'
import SSpacer from '@/components/SSpacer'
import EOS from '@/components/partners/EOS'
export default {
  name: 'SupportedChains',
  components: {
    SectionTitle,
    SSpacer,
    EOS
  },
  data: () => ({
    items: [
      {
        image: 'https://bloks.io/img/history/greymass.svg',
        url: 'https://greymass.com/en/'
      },
    ]
  })
}
</script>

<style scoped lang="scss">
.supported-chains {
  background: linear-gradient(181.03deg,
      rgba(255, 255, 255, 0) 0%,

      rgba(57, 255, 136, 0.02) 15%,
      rgba(57, 255, 136, 0.1) 50%,
      rgba(57, 255, 136, 0.02) 85%,

      rgba(255, 255, 255, 0) 100%);
  padding: 20px 0;
  min-height: 300px;
}

.section-title {
  margin-bottom: 20px;
}

.chains {
  margin-bottom: 30px;
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
}

.inner-container {
  padding: 40px 10px;
  background-color: var(--hover);
  border-radius: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;

  .title {
    font-size: 2rem;
    text-align: center;

    &:last-of-type {
      margin-top: 40px;
    }
  }

  .text {
    text-align: center;
    margin: 10px 0;
    margin-bottom: 40px;
    color: var(--text-grey-thirdly);
  }

  .social-items {
    display: flex;
    justify-content: space-evenly;
    flex-wrap: wrap;
    width: 100%;

    // max-width: 640px;
    .item {
      display: flex;
      flex-direction: column;
      align-items: center;
      transition: opacity 0.3s;

      @media only screen and (max-width: 600px) {
        width: 50%;
      }

      padding: 8px 12px;

      &:hover {
        opacity: 0.8;
      }

      .icon {
        width: 60px;
        height: 60px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: white;
        border-radius: 12px;

        img {
          width: 48px;
          height: 48px;
        }
      }
    }

    .name {
      margin: 8px 0;
      color: var(--text-default);
      font-size: 22px;
      font-weight: medium;
    }

    .desc {
      color: var(--text-grey-thirdly);
      text-align: center;
    }
  }
}

.chain {
  object-fit: contain;
}

@media only screen and (max-width: 1240px) {
  .chains {
    justify-content: center;
    align-items: center;

    .chain {
      margin: 12px;
    }
  }
}

@media only screen and (max-width: 640px) {
  .chains {
    flex-direction: column;
  }

  .chain {
    max-width: 90%;
    fill: red;
    color: red;

  }

  .more {
    margin-top: 15px;
  }
}


.items {
  margin-top: 40px;
  display: flex;
  align-items: center;
  gap: 70px;

  @media only screen and (max-width: 600px) {
    gap: 36px;
  }


  .item {
    display: flex;

    img {
      height: 46px;

      @media only screen and (max-width: 600px) {
        height: 26px;
      }

    }
  }
}
</style>
