<template lang="pug">
.withdraw-address
  ElTabs(v-model="activeTab")
    ElTabPane(label="Address" name="address")
    ElTabPane(label="Alcor User" name="user")
</template>

<script>
export default {
  name: 'WithdrawAddress',
  data: () => ({
    activeTab: 'address', // user
  }),
}
</script>

<style lang="scss"></style>
