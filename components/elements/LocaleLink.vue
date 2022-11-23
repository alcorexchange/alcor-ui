<template lang="pug">
nuxt-link(:to="localePath(to, $i18n.locale)")
  slot
</template>

<script>
export default {
  props: ['to']
}
</script>
