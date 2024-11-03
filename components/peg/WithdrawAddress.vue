<template lang="pug">
.withdraw-address
  ElTabs(v-model="activeTab")
    ElTabPane(label="Address" name="address")
    ElTabPane(label="Alcor User" name="user")
</template>

<script>
export default {
  name: 'WithdrawAddress',
  props: ['networks'],
  data: () => ({
    activeTab: 'address', // user
  }),

  computed: {},
}
</script>

<style lang="scss"></style>
