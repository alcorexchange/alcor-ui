<template lang="pug">
.text-success(v-if="change > 0") +{{ change.toFixed(1) }}%
span(v-else-if="change == 0") {{ change.toFixed(1) }}%
.text-danger(v-else) {{ change.toFixed(1) }}%
</template>

<script>
export default {
  props: ['change']
}
</script>
