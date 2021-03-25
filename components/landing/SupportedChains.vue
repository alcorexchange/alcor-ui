<template lang="pug">
  .supported-chains
    .alcor-inner
      SectionTitle.section-title Supported Chains
      .chains
        img.chain(src="~/assets/images/supportedchain-1.svg")
        img.chain(src="~/assets/images/supportedchain-2.svg")
        img.chain(src="~/assets/images/supportedchain-3.svg")
        img.chain(src="~/assets/images/supportedchain-4.svg")
        span.more and more...
      .inner-container
        span.title Building a global community.
        p.text Learn more about Alcor, chat with the community, and get announcements faster than anyone.
        .social-items
          a.item(href="#")
            .icon
              img(src="~/assets/icons/Telegram.svg")
            span.name Telegram
            span.desc Cross-Chain DEX
          a.item(href="#")
            .icon
              img(src="~/assets/icons/Monogram.svg")
            span.name Medium
            span.desc Cross-Chain DEX
          a.item(href="#")
            .icon
              img(src="~/assets/icons/Github.svg")
            span.name Github
            span.desc Cross-Chain DEX
          a.item(href="#")
            .icon
              img(src="~/assets/icons/Twitter.svg")
            span.name Twitter
            span.desc Cross-Chain DEX
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
  data: () => ({})
}
</script>

<style scoped lang="scss">
.supported-chains {
  background: linear-gradient(
    181.03deg,
    rgba(255, 255, 255, 0) -7.7%,
    rgba(57, 255, 136, 0.09) 50.74%,
    rgba(255, 255, 255, 0) 106.8%
  );
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
}
.inner-container {
  padding: 40px 10px;
  background: rgba(33, 33, 33, 0.6);
  border-radius: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  .title {
    font-size: 2rem;
  }
  .text {
    margin: 10px 0;
    margin-bottom: 40px;
    color: var(--text-grey-thirdly);
  }
  .social-items {
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    width: 100%;
    max-width: 640px;
    .item {
      display: flex;
      flex-direction: column;
      align-items: center;
      transition: opacity 0.3s;
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
    }
    .desc {
      color: var(--text-grey-thirdly);
    }
  }
}
</style>
