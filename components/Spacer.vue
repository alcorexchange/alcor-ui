<template>
  <div :class="['spacer', { high }]"></div>
</template>

<script>
export default {
  props: {
    high: {
      default: false
    }
  }
}
</script>

<style scoped>
.spacer {
  height: 40px;
}
.high {
  height: 60px;
}
</style>
