<template lang="pug">
.pointer
  small.muted % Fee Rate
  .desc
    span.title.muted Maker Fee
    span.value  {{ (meta.fee / 100).toFixed(4) }}%
    span.title.muted Taker Fee
    span.value  {{ (meta.fee / 100).toFixed(4) }}%
  //- el-dropdown(placement="top").fee-rate
  //-   AlcorButton(flat) Fee Rate
  //-   el-dropdown-menu(slot="dropdown").dropdown-content
</template>

<script>
import { mapGetters } from 'vuex'
import AlcorButton from '@/components/AlcorButton.vue'

export default {
  name: 'FeeRate',
  components: {
    AlcorButton
  },

  computed: {
    ...mapGetters('market', ['meta'])
  }
}
</script>

<style scoped lang="scss">
.pointer {
  .desc {
    display: grid;
    grid-template-columns: auto 1fr;
    .title {
      justify-self: start;
    }
  }
}
</style>
