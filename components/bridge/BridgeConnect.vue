<template lang="pug">
.bridge-connect()
  .label {{ hideLabel ? '' : label }}
  .connect
    .beforeConnect {{ hideLabel ? '' : beforeConnect }}
    AlcorButton Connect
</template>

<script>
import AlcorButton from '@/components/AlcorButton.vue'
export default {
  components: {
    AlcorButton
  },
  props: ['label', 'beforeConnect', 'hideLabel'],
}
</script>

<style scoped lang="scss">
.bridge-connect {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.connect {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
