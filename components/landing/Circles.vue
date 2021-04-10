<template>
<!-- eslint-disable -->

<!-- Instruction https://alligator.io/css/patterns-css-doodle/ -->
<div class="circles">
  <css-doodle id="ddl" class="doodle">
    <style>
      @grid: 15x1 / 1200px;
      @place-cell: center;
      @size: 100%;

      animation: m @r(10s, 30s) -@r(100s) linear infinite;

      @keyframes m {
        to { transform: rotate(1turn) }
      }

      background: @svg(
        <svg viewBox="0 0 100 100">
          <defs>
            <linearGradient id="e">
              <stop stop-color="#949494" offset="0" />
              <stop stop-color="#484749" stop-opacity="0" offset="1" />
            </linearGradient>
          </defs>
          <circle
            cx="50" cy="50"
            r="@calc(5 + 30 / @I * @i)"
            fill="none"
            stroke="url(#e)"
            stroke-width=".3"
            stroke-dashoffset="0"
            stroke-linecap="round"
            stroke-dasharray="@calc(15 + 30 / @I * @i * 3)"
          />
        </svg>
      );
      @even {
        animation-direction: reverse;
        background: @svg(
          <svg viewBox="0 0 100 100">
            <defs>
              <linearGradient id="e">
                <stop stop-color="rgba(255, 255, 255, 0)" offset="0" />
                <stop stop-color="#49b054" offset="1" />
              </linearGradient>
            </defs>
            <circle
              cx="50" cy="50"
              r="@calc(5 + 30 / @I * @i)"
              fill="none"
              stroke="url(#e)"
              stroke-width=".3"
              stroke-dashoffset="0"
              stroke-linecap="round"
              stroke-dasharray="@calc(15 + 30 / @I * @i * 3)"
            />
          </svg>
        );
      }
    </style>
  </css-doodle>
  <img id="logo" class="logo" src="~/assets/images/frame_logo.svg" alt="" />
</div>
</template>

<script>
export default {
  mounted() {
    document.getElementById('logo').classList.add('is-load')
    document.getElementById('ddl').classList.add('is-load')
  }
}
</script>

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
  opacity: .1;
}

.doodle {
  opacity: 0;
  pointer-events: none;
}

.is-load {
 transition: all 6s;
 -webkit-transition: all 6s;
 opacity: 1;
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
