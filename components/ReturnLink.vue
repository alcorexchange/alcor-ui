<template lang="pug">
  #return-btn.d-flex.gap-4(@click="$router.back()") Return
</template>

<style lang="scss" scoped>
#return-btn::before {
  content: '←';
}

#return-btn {
  margin-top: 12px;
  font-weight: 500;
  font-size: 14px;
  color: #9f979a !important;
  cursor: pointer;
}
</style>
