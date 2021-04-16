<template lang="pug">
  el-dialog(:visible="isActive" @close="closeDialog" class="alcor-loading") Some data here
</template>

<script>
import { mapMutations, mapGetters } from 'vuex'
export default {
  data: () => ({}),
  methods: {
    ...mapMutations({
      openDialog: 'loading/OPEN',
      closeDialog: 'loading/CLOSE'
    })
  },
  computed: {
    ...mapGetters({
      isActive: 'loading/isActive'
    })
  }
}
</script>

<style scoped lang="scss"></style>
