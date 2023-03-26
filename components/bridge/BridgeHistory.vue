<template lang="pug">
.bridge-history.mt-4
  .toggle.d-flex.justify-content-center
    AlcorButton Toggle
  .items.mt-2
    .item(v-for='x in 4')
      .status.red
        i.el-icon-error
        span incomplete
      .main-content
        .left
          .network
            img(:src="require(`~/assets/icons/${'wax'}.png`)").network-img
            span EOS
          .token-container
            img.token-img(:src="require(`~/assets/icons/${'matic'}.png`)")
            .amount 10.00
            .symbol TLM
          .tx
            img(:src="require(`~/assets/icons/${'eos'}.png`)").tx-img
            span.tx-Link TX link
        .arrow
          i.el-icon-right
        .right
          .network
            img(:src="require(`~/assets/icons/${'matic'}.png`)").network-img
            span EOS
          .token-container
            img.token-img(:src="require(`~/assets/icons/${'matic'}.png`)")
            .amount 10.00
            .symbol TLM
          .tx
            img(:src="require(`~/assets/icons/${'eos'}.png`)").tx-img
            span.tx-Link TX link
      .date.disable 2d ago
</template>

<script>
import AlcorButton from '~/components/AlcorButton.vue'

export default {
  name: 'BridgeHistory',
  components: {
    AlcorButton,
  },
}
</script>

<style scoped lang="scss">
.items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.item {
  padding: 8px;
  background: var(--background-color-secondary);
  position: relative;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  .status {
    position: absolute;
    top: 8px;
    right: 8px;
    box-shadow: 0 0 0 1px var(--main-red);
    padding: 2px 4px;
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.86rem;
    border-radius: 4px;
  }
  .main-content-container {
    display: flex;
    justify-content: center;
  }
  .main-content {
    display: flex;
    align-items: flex-start;
    align-self: center;
    gap: 8px;
    .left, .right {
      display: flex;
      gap: 4px;
      flex-direction: column;
    }
    .arrow i {
      font-size: 1.6rem;
    }
    .left {
      align-items: flex-end;
    }
    .right {
      align-items: flex-start;
    }
    .network {
      background: var(--btn-active);
      padding: 2px 4px;
      border-radius: 20px;
      display: flex;
      font-size: 0.86rem;
      align-items: center;
      gap: 4px;
      &-img {
        height: 18px;
      }
    }
    .token-container {
      display: flex;
      gap: 4px;
      align-items: center;
    }
    .token-img {
      height: 18px;
    }
    .tx {
      display: flex;
      align-items: center;
      font-size: 0.86rem;
      .tx-img {
        height: 18px;
      }
    }
  }
  .date {
    align-self: flex-end;
    position: absolute;
    bottom: 8px;
    right: 8px;
  }
  &:before {
    content: "";
    z-index: -1;
    position: absolute;
    top: 0;
    right: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(to left, #5c6fff 0%, #ff930f 100% );
    transform: scale(0.998);
    filter: blur(2px);
    opacity: var(0.7);
    border-radius: inherit;
  }
}
</style>
