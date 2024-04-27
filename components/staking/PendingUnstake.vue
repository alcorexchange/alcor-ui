<template lang="pug">
  .pending-unstake Pending unstakes will show here
    .items
      .item(v-for="item in unstakes") {{ item.id }}
</template>

<script>
export default {
  name: 'PendingUnstake',
  props: ['unstakes'],
}
</script>

<style></style>
