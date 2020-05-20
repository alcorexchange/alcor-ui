<template lang="pug">
div
  span.text-success(v-if="change > 0") {{ change.toFixed(1) }}%
  span(v-if="change == 0") {{ change.toFixed(1) }}%
  span.text-danger(v-if="change < 0") {{ change.toFixed(1) }}%
</template>

<script>
export default {
  props: ['change']
}
</script>
