<template lang="pug">
  .d-flex.align-items-center.gap-8
    img(
      :src='require("~/assets/icons/" + network.value + ".png")',
      height=18
    )
    .ml-2 {{ network.label }}

</template>

<script>
export default {
  props: ['network']
}
</script>
