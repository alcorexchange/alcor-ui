<template>
  <section>
    <svg
      class="spinner"
      width="174px"
      height="174px"
      viewBox="0 0 66 66"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        class="path"
        fill="transparent"
        stroke-width="2"
        cx="33"
        cy="33"
        r="30"
        stroke="url(#gradient)"
      />
      <linearGradient id="gradient">
        <stop offset="50%" stop-color="#42d179" stop-opacity="1" />
        <stop offset="65%" stop-color="#42d179" stop-opacity=".5" />
        <stop offset="100%" stop-color="#42d179" stop-opacity="0" />
      </linearGradient>
      <!-- </circle> -->
    </svg>
  </section>
</template>

<script>
export default {}
</script>

<style scoped>
section {
  /* width: 200px; */
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  padding: 20px;
  /* transform: scale(0.8); */
}

.spinner {
  animation: rotate 1.4s linear infinite;
  -webkit-animation: rotate 1.4s linear infinite;
  -moz-animation: rotate 1.4s linear infinite;
  width: 144px;
  height: 144px;
  position: relative;
}

.spinner-dot {
  width: 274px;
  height: 274px;
  position: relative;
  top: 0;
}

@keyframes rotate {
  to {
    transform: rotate(360deg);
  }
}

@-webkit-keyframes rotate {
  to {
    -webkit-transform: rotate(360deg);
  }
}

@-moz-keyframes rotate {
  to {
    transform: rotate(360deg);
  }
}

.path {
  stroke-dasharray: 170;
  stroke-dashoffset: 20;
}
</style>
