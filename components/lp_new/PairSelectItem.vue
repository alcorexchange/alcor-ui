<template lang="pug">
.select-pair(@click="$emit('click')")
    .icon-and-name
        .pair-icon
            img(src="https://cdn.worldvectorlogo.com/logos/ethereum-eth.svg")
        .name ETH
    i.el-icon-arrow-down
</template>

<script>
export default {
  name: 'SelectPair'
}
</script>

<style scoped lang="scss">
.select-pair {
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: var(--card-shadow);
  padding: 6px;
  border-radius: var(--radius-2);
  cursor: pointer;
  border: 1px solid var(--border-color);
  transition: background 0.3s;
  &:hover {
    background: var(--hover);
  }
}
.icon-and-name {
  display: flex;
  align-items: center;
}
img {
  width: 24px;
  height: 24px;
  margin-right: 4px;
}
</style>
