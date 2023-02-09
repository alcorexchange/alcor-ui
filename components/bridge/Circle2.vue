<template>
  <!-- eslint-disable -->
  <div class="circl">
    <svg viewBox="0 0 100 100">
      <defs data-v-e215fa34="">
        <linearGradient id="a1">
          <stop :stop-color="COLOR" offset="0"></stop>
          <stop stop-color="rgba(255, 255, 255, 0)" stop-opacity="0" offset="1"></stop>
        </linearGradient>
        <linearGradient id="a2">
          <stop stop-color="rgba(255, 255, 255, 0)" offset="0"></stop>
          <stop :stop-color="COLOR" offset="1"></stop>
        </linearGradient>
      </defs>
      <g transform-origin="50% 50%" stroke-width=".6" fill="none" stroke-dashoffset="0" stroke-linecap="round"></g>
    </svg>
    <img id="logo2" class="logo2" src="~/assets/images/frame_logo.svg" alt="" />
  </div>
</template>

<script>
export default {
  props: ['color', 'total'],

  data: () => ({
    COLOR: 'white' // Dynamic prop for stroke color
  }),

  watch: {
    color() {
      if (!this.COLOR) {
        this.COLOR = this.color
      } else {
        this.changeColor()
      }
    }
  },

  mounted() {
    this.COLOR = this.color
    setTimeout(() => { this.init() }, 500)
  },

  methods: {
    changeColor(to) {
      document.querySelectorAll('.circl .is-load').forEach(e => {
        e.style.transition = 'opacity .2s linear'
        e.style.opacity = 0

        setTimeout(() => {
          e.style.transition = 'opacity .8s linear'
          e.style.opacity = 0.8
          this.COLOR = this.color
        }, 150)
      })
    },

    init() {
      document.getElementById('logo2').classList.add('is-load')
      document.querySelector('.circl g').innerHTML = this.generateCircle(20)
      setTimeout(() => document.querySelector('.circl g').classList.add('is-load'), 10)
    },

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
          const duration = this.random(20, 70)
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
.circl {
  svg {
    width: 1200px;
    height: 1200px;

    @media only screen and (max-width: 640px) {
      width: 500px;
      height: 500px;
    }
  }

  circle {
    stroke: url(#a1);
    animation-name: r;
    transform-origin: 50% 50%;
    animation-duration: calc(var(--duration) * 1s);
    animation-delay: calc(var(--delay) * 1s);
    animation-iteration-count: infinite;
    animation-timing-function: linear;

    opacity: 0;
    transition: opacity 6s;
    -webkit-transition: opacity 6s;
  }

  circle:nth-child(even) {
    stroke: url(#a2);
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

<style lang="scss">
.circl {
  position: absolute;
  z-index: 0;

  pointer-events: none;

  @media only screen and (max-width: 640px) {
    top: 25%;
    left: -25%;
  }
}

.logo2 {
  position: absolute;
  left: 50%;
  top: 50%;
  -webkit-transform: translate(-50%, -50%);
  transform: translate(-50%, -50%);

  height: 130px;
  opacity: 0.3;

  @media only screen and (max-width: 640px) {
    left: 250px;
    height: 50px;
  }

}

.is-load {
  transition: opacity 6s;
  -webkit-transition: opacity 6s;

  opacity: 0.6;

  circle {
    opacity: 0.8 !important;
  }
}

@media only screen and (max-width: 1040px) {
  .circl {
    right: -40%;
  }
}

@media only screen and (max-width: 840px) {
  .circl {
    right: 50%;
    // top: 50%;
    transform: translateX(50%);
  }
}
</style>
