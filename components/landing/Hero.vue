<template lang="pug">
.hero
  .left
    h2 All in one DeFi
    p.desc Alcor is a lego of decentralized finance built on multi-chain, and a provider of solutions in one tap.
    .actions
      AlcorLink.start Start Trading
      AlcorLink Read docs
  .right
    img.frame(src='~/assets/images/frame.svg')
</template>

<script>
import AlcorLink from '@/components/AlcorLink'
export default {
  name: 'Hero',
  components: {
    AlcorLink,
  },
}
</script>

<style scoped lang="scss">
.hero {
  height: 340px;
  display: flex;
  flex-wrap: wrap;
  position: relative;
}
.left {
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
  width: 50%;
  position: relative;
  z-index: 2;
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
    background: var(--main-green);
    color: white !important;
    &:hover {
      opacity: 0.8;
    }
  }
}
.theme-dark .actions {
  .start {
    background: var(--btn-active);
    color: var(--main-green) !important;
  }
}
.right {
  position: relative;
  width: 50%;
  height: 100%;
  z-index: 0;
}
.frame {
  position: absolute;
  width: 1000px;
  top: 50%;
  transform: translate(0, -50%);
  right: -15%;
}

@media only screen and (max-width: 1040px) {
  .frame {
    right: -40%;
  }
}
@media only screen and (max-width: 840px) {
  .left,
  .right {
    width: 100%;
    align-items: center;
  }
  .right {
    position: absolute;
    opacity: 0.4;
  }
  .frame {
    right: 50%;
    transform: translate(50%, -50%);
  }
  h2,
  .desc {
    text-align: center;
  }
}
</style>
