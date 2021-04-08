<template>
  <div class="hero">
    <div class="left">
      <h2>All in one DeFi</h2>
      <p class="desc">
        Alcor is a lego of decentralized finance built on multi-chain, and a
        provider of solutions in one tap.
      </p>
      <div class="actions">
        <AlcorLink class="start">Start Trading</AlcorLink>
        <AlcorLink>Read docs</AlcorLink>
      </div>
    </div>
    <div class="right">
      <!-- <img src="~/assets/images/frame_logo.svg" class="frame_logo"> -->
      <css-doodle class="frame">
        <style>
          @grid: 15x1 / 1200px;
          @place-cell: center;
          @size: 100%;
          animation: m @r (10s, 30s) -@r (100s) linear infinite;
          @keyframes m {
            to {
              transform: rotate(1turn);
            }
          }
          background: @svg
            (
              <svg viewBox= '0 0 100 100' > <defs> <linearGradient id= 'e' >
                <stop stop-color= '#949494' offset= '0' / > <stop stop-color=
                '#484749' stop-opacity= '0' offset= '1' / > </linearGradient>
                </defs> <circle cx= '50' cy= '50' r= '@calc(5 + 30 / @I * @i)'
                fill= 'none' stroke= 'url(#e)' stroke-width= '.3'
                stroke-dashoffset= '0' stroke-linecap= 'round' stroke-dasharray=
                '@calc(15 + 30 / @I * @i * 3)' / > </svg>
            );
          @even {
            animation-direction: reverse;
            background: @svg
              (
                <svg viewBox= '0 0 100 100' > <defs> <linearGradient id= 'e' >
                  <stop stop-color= 'rgba(255, 255, 255, 0)' offset= '0' / >
                  <stop stop-color= '#49b054' offset= '1' / > </linearGradient>
                  </defs> <circle cx= '50' cy= '50' r= '@calc(5 + 30 / @I * @i)'
                  fill= 'none' stroke= 'url(#e)' stroke-width= '.3'
                  stroke-dashoffset= '0' stroke-linecap= 'round'
                  stroke-dasharray= '@calc(15 + 30 / @I * @i * 3)' / > </svg>
              );
          }
        </style>
      </css-doodle>
      <img src="~/assets/images/frame_logo.svg" alt="" />
    </div>
  </div>
</template>

<script>
import AlcorLink from '@/components/AlcorLink'
export default {
  name: 'Hero',
  components: {
    AlcorLink
  },

  mounted() {}
}
</script>

<style lang="scss" scoped>
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
  pointer-events: none;

  top: -100%;
  right: -50%;
}

.frame_logo {
  position: absolute;
  top: 60%;
  left: 40%;
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
