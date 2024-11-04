<template lang="pug">
.withdraw-address
  ElTabs(v-model="activeTab")
    ElTabPane(label="Address" name="address")
    ElTabPane(label="Alcor User" name="user")

  .tab(v-if="activeTab === 'address'")
    div
      span.fs-14.muted Address
      ElInput(:value="address" @input="$emit('update:address', $event)" placeholder="Enter withdrawal address")

    div.mt-3
      span.fs-14.muted Network
      ElSelect(:value="selectedNetwork" @input="$emit('update:selectedNetwork', $event)" @change="$emit('handleNetworkChange')").w-100.network-select
        ElOption(v-for="item in networks" :key="item.code" :label="item.name" :value="item.code")
  .tab(v-if="activeTab === 'user'")
    div
      span.fs-14.muted Account
      ElInput(:value="alcorUser" @input="$emit('update:alcorUser', $event)" placeholder="Enter Alcor Account")
</template>

<script>
export default {
  name: 'WithdrawAddress',
  props: ['networks', 'selectedNetwork', 'address', 'alcorUser'],
  data: () => ({
    activeTab: 'address', // user
  }),

  computed: {},
}
</script>

<style lang="scss"></style>
