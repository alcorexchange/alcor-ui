<template>
  <!-- eslint-disable -->

  <!-- This animation is made by: https://twitter.com/yuanchuan23 -->
  <div class="circles">
    <svg viewBox="0 0 100 100" width="1200px" height="1200px">
      <defs data-v-e215fa34="">
        <linearGradient id="g1">
          <stop stop-color="#949494" offset="0"></stop>
          <stop stop-color="#484749" stop-opacity="0" offset="1"></stop>
        </linearGradient>
        <linearGradient id="g2">
          <stop stop-color="rgba(255, 255, 255, 0)" offset="0"></stop>
          <stop stop-color="#49b054" offset="1"></stop>
        </linearGradient>
      </defs>
      <g
        transform-origin="50% 50%"
        stroke-width=".3"
        fill="none"
        stroke-dashoffset="0"
        stroke-linecap="round"
      ></g>
    </svg>
    <img id="logo" class="logo" src="~/assets/images/frame_logo.svg" alt="" />
  </div>
</template>

<script>
export default {
  mounted() {
    document.getElementById('logo').classList.add('is-load')
    document.querySelector('.circles g').innerHTML = this.generateCircle(15)
    setTimeout(() => document.querySelector('.circles g').classList.add('is-load'), 10)
  },

  methods: {
    random(start, end) {
      const t = Math.random()
      return start * (1 - t) + end * t
    },

    generateCircle(total) {
      return Array.from(Array(total), (_, i) => i + 1)
        .map((i) => {
          const r = 5 + (30 / total) * i
          const dash = 15 + (30 / total) * i * 3
          const delay = this.random(-100, 0)
          const duration = this.random(15, 40)
          return `
          <circle 
            style="--delay: ${delay}; --duration: ${duration}" 
            cx="50" cy="50" r="${r}" stroke-dasharray="${dash}" 
           />
        `
        })
        .join('')
    }
  }
}
</script>

<style lang="scss">
.circles {
  circle {
    stroke: url(#g1);
    animation-name: r;
    transform-origin: 50% 50%;
    animation-duration: calc(var(--duration) * 1s);
    animation-delay: calc(var(--delay) * 1s);
    animation-iteration-count: infinite;
    animation-timing-function: linear;

    opacity: 0;
    transition: all 6s;
    -webkit-transition: all 6s;
  }
  circle:nth-child(even) {
    stroke: url(#g2);
    animation-direction: reverse;
  }
  @keyframes r {
    to {
      transform: rotate(1turn);
    }
  }

  .is-load {
    circle {
      opacity: 1;
    }
  }
}
</style>

<style scoped lang="scss">
.circles {
  position: absolute;
  z-index: 0;

  pointer-events: none;

  top: -100%;
  right: -50%;
}

.logo {
  position: absolute;
  left: 50%;
  top: 50%;
  -webkit-transform: translate(-50%, -50%);
  transform: translate(-50%, -50%);

  height: 130px;
  opacity: 0.1;
}

.is-load {
  transition: all 6s;
  -webkit-transition: all 6s;
  opacity: 1;

  circle {
    opacity: 1 !important;
  }
}
@media only screen and (max-width: 1040px) {
  .circles {
    right: -40%;
  }
}
@media only screen and (max-width: 840px) {
  .circles {
    right: 50%;
    // top: 50%;
    transform: translateX(50%);
  }
}
</style>
