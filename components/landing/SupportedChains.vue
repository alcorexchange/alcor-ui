<template lang="pug">
.supported-chains
  .alcor-inner
    SectionTitle.section-title Supported & Upcoming Chains
    .chains
      img.chain(src='~/assets/images/supportedchain-4.svg')
      img.chain(src='~/assets/images/supportedchain-1.svg')
      img.chain(src='~/assets/images/supportedchain-2.svg')
      img.chain(src='~/assets/images/supportedchain-3.svg')
      span.more and more...
    .inner-container
      span.title Building a global community.
      p.text Learn more about Alcor, chat with the community,
        br
        | and get announcements faster than anyone.
      .social-items
        a.item(href="https://t.me/alcorexchange" target="_blank")
          .icon
            img(src='~/assets/icons/Telegram.svg')
          span.name Telegram
          span.desc Support & Trading Talks
        a.item(href="https://avral.medium.com/" target="_blank")
          .icon
            img(src='~/assets/icons/Monogram.svg')
          span.name Medium
          span.desc Reviews & News
        a.item(href="https://twitter.com/alcorexchange" target="_blank")
          .icon
            img(src='~/assets/icons/Twitter.svg')
          span.name Twitter
          span.desc Announcements
        a.item(href="https://github.com/avral/alcor-ui" target="_blank")
          .icon
            img(src='~/assets/icons/Github.svg')
          span.name Github
          span.desc Code & Contribuion
      span.title Partners & API Providers
      .items
        a.item(v-for="{ image, url, padding } in items" :href="url" target="_blank" :style="{ padding }")
          img(:src="image")

</template>

<script>
import SectionTitle from '@/components/landing/SectionTitle'
import SSpacer from '@/components/SSpacer'
export default {
  name: 'SupportedChains',
  components: {
    SectionTitle,
    SSpacer
  },
  data: () => ({
    items: [
      {
        image: require('@/assets/images/partner-greymass.png'),
        url: 'https://greymass.com/en/'
      },
      {
        image: require('@/assets/images/partner-eos-amesterdam.png'),
        url: 'https://eosamsterdam.net/',
        padding: '40px'
      }]
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
  background: rgba(33, 33, 33, 0.6);
  background: var(--hover);
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

.items {
  margin-top: 40px;
  display: flex;
  align-items: center;
  gap: 70px;

  .item {
    display: flex;

    img {
      height: 61px;
    }
  }
}
</style>
