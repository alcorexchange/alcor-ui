<template>
  <div :class="['spacer', { high }]"></div>
</template>

<script>
export default {
  props: {
    high: {
      default: false,
      type: Boolean
    }
  }
}
</script>

<style scoped>
.spacer {
  height: 8px;
}
.high {
  height: 14px;
}
</style>
