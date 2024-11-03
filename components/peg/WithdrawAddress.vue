<template lang="pug">
.withdraw-address
  ElTabs(v-model="activeTab")
    ElTabPane(label="Address" name="address")
    ElTabPane(label="Alcor User" name="user")

  .tab(v-if="activeTab === 'address'")
    div
      span.fs-14.muted Address
      ElInput(v-model="address" placeholder="Enter withdrawal address")

    div.mt-3
      span.fs-14.muted Network
      ElSelect(:value="selectedNetwork" @input="$emit('update:selectedNetwork', $event)" @change="$emit('handleNetworkChange')").w-100.network-select
        ElOption(v-for="item in networks" :key="item.code" :label="item.name" :value="item.code")
  .tab(v-if="activeTab === 'user'") User Tab
</template>

<script>
export default {
  name: 'WithdrawAddress',
  props: ['networks', 'selectedNetwork'],
  data: () => ({
    activeTab: 'address', // user
    address: null,
    alcorUser: null,
  }),

  computed: {},
}
</script>

<style lang="scss"></style>
