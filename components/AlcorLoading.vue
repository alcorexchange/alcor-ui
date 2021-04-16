<template lang="pug">
  el-dialog(:visible="isActive" :title="title" @close="closeDialog" class="alcor-loading")
    CircleLoadingSvg.circle-svg
    .text {{text}}
</template>

<script>
import { mapMutations, mapGetters } from 'vuex'
import CircleLoadingSvg from '@/components/CircleLoadingSvg'
export default {
  components: {
    CircleLoadingSvg
  },
  data: () => ({}),
  computed: {
    ...mapGetters({
      isActive: 'loading/isActive',
      title: 'loading/title',
      text: 'loading/text'
    })
  },
  methods: {
    ...mapMutations({
      openDialog: 'loading/OPEN',
      closeDialog: 'loading/CLOSE'
    })
  }
}
</script>

<style scoped lang="scss">
.text {
  padding: 14px 0;
  color: var(--text-default);
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
