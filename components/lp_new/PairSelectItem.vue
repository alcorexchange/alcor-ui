<template lang="pug">
.select-pair(@click="$emit('click')")
    .icon-and-name
        .pair-icon
            TokenImage.token-image(:src="$tokenLogo(token.symbol, token.contract)" height="24")
        .name {{token.symbol || 'Select Token'}}
    i.el-icon-arrow-down
</template>

<script>
import TokenImage from '@/components/elements/TokenImage.vue'
export default {
  name: 'SelectPair',
  components: {
    TokenImage
  },
  props: ['token']
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
.token-image {
  margin-right: 4px;
}
</style>
