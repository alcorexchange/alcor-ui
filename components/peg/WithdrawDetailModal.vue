<template lang="pug">
  ElDialog(:visible="active" @update:visible="$emit('update:visible', $event)")
</template>

<script>
export default {
  name: 'WithdrawDetailModal',
  props: ['active', 'context'],
}
</script>

<style lang="scss"></style>
