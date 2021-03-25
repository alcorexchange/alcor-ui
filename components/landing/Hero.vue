<template lang="pug">
  .hero
    .left
      h2 All in one DeFi
      p.desc Alcor is a lego of decentralized finance built on multi-chain, and a provider of solutions in one tap.
      .actions
        AlcorLink(green).start Start Trading
        AlcorLink Read docs
    .right
      img.frame(src="~/assets/images/frame.svg")
</template>

<script>
import AlcorLink from '@/components/AlcorLink'
export default {
  name: 'Hero',
  components: {
    AlcorLink
  }
}
</script>

<style scoped lang="scss">
.hero {
  height: 340px;
  display: flex;
}
.left {
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
  width: 50%;
}
h2 {
  font-size: 3rem;
}
.desc {
  width: 100%;
  max-width: 360px;
}
.actions {
  margin-top: 20px;
  & > * {
    padding: 6px 20px !important;
  }
  .start {
    margin-right: 15px;
  }
}
.right {
  position: relative;
  width: 50%;
  height: 100%;
}
.frame {
  position: absolute;
  width: 1000px;
  top: 50%;
  transform: translate(0, -50%);
  right: -15%;
  z-index: 0;
}
</style>
