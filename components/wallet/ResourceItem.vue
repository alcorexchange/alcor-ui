<template lang="pug">
.el-card.resource-item
    span.title.fwr Ram
    el-progress(:percentage="getPercentage('net_limit')" :width="154" type="circle" color="#2fe6a2" :stroke-width="32" stroke-linecap="butt")
    .details
        .amount.cancel 3.91 KB / 5.37 KB
        .staked
            span.cancel Staked:&nbsp;
            span.fwr 3.24803955 WAX
</template>

<script>
export default {
  name: 'ResourceItem',
  methods: {
    getPercentage(resource) {
      return 20 // TEST
      //   if (!this.account) return
      //   const total = this.account[resource].max
      //   const used = this.account[resource].used
      //   return parseInt((used / total) * 100)
    }
  }
}
</script>

<style scoped lang="scss">
.resource-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 14px;
}
.title {
  margin-bottom: 14px;
}
.details {
  margin-top: 14px;
}
</style>
