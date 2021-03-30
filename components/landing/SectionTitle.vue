<template lang="pug">
  h2.home-title
    slot
</template>

<script>
export default {
  name: 'SectionTitle'
}
</script>

<style scoped lang="scss">
.home-title {
  font-weight: normal;
  color: var(--main-green);
  font-size: 1.3rem;
  margin-bottom: 5px;
}
@media only screen and (max-width: 600px) {
  .home-title {
    padding: 0 8px;
  }
}
</style>
