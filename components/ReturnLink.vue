<template lang="pug">
div.return-link.disable.hover-c-contrast.pointer(@click="$router.back()")
  i.el-icon-arrow-left
  slot
</template>

<style scoped lang="scss">
.return-link {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
