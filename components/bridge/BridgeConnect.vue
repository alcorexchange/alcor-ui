<template lang="pug">
.bridge-connect()
  .label {{ label }}
  .connect
    AlcorButton Connect
</template>

<script>
import AlcorButton from '@/components/AlcorButton.vue'
export default {
  components: {
    AlcorButton
  },
  props: ['label'],
}
</script>

<style scoped lang="scss">
.bridge-connect {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
