<template lang="pug">
.note
  span.note-text Note:&nbsp;
  span.main
    slot
</template>

<script>
export default {
  name: 'Note',
}
</script>

<style scoped lang="scss">
.note-text {
  font-weight: 500;
  color: #64d2ff;
}
.main {
  color: var(--disabled-indicator);
}
</style>
