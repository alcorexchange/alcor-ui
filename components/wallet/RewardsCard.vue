<template lang="pug">
.el-card.resource-page-card
    .header
        i.el-icon-present
        span.text Genesis and Voting Rewards
    .main
        span.key.fwr Genesis Balance
        span.value 0.00000933 WAX
</template>

<script>
export default {
  name: 'RewardsCard'
}
</script>

<style lang="scss" scoped>
.resource-page-card {
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
}
</style>
