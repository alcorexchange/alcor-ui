<template>
  <div :class="['spacer', { high, low }]" />
</template>

<script>
export default {
  props: {
    high: {
      default: false,
      type: Boolean
    },
    low: {
      default: false,
      type: Boolean
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
.low {
  height: 20px;
}
</style>
