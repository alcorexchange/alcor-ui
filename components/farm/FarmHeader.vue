<template lang="pug">
  .farm-header
    .left
      el-input(placeholder="Search Tokens")
      AlcorSwitch(
        one="Active"
        two="Finished"
      )
      .stacked-only
        el-switch(
          active-text="Stacked only"
        )
    .right
</template>

<script>
import AlcorSwitch from '@/components/AlcorSwitch'
export default {
  name: 'FarmHeader',
  components: {
    AlcorSwitch,
  },
}
</script>

<style></style>
