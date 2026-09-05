<template lang="pug">
  .gradient-border(:style="`--border-width: ${borderWidth || '2px'}`")
    .background
    slot
</template>

<script>
export default {
  name: 'GradientBorder',
  props: ['borderWidth'],
}
</script>

<style scoped lang="scss">
@property --gradient-angle {
  syntax: '<angle>';
  inherits: false;
  initial-value: 0deg;
}
.gradient-border {
  position: relative;
}
.background {
  --gradient-angle: 10deg;
  --translate: calc(var(--border-width) / 2 * -1);
  position: absolute;
  top: 0;
  left: 0;
  width: calc(100% + var(--border-width));
  height: calc(100% + var(--border-width));
  transform: translate(var(--translate), var(--translate));
  z-index: 0;
  border-radius: 4px;
  animation: rotate 6s linear 0s infinite reverse;
  transition: all 0.2s;
  background: linear-gradient(
    var(--gradient-angle),
    transparent,
    transparent,
    var(--main-green),
    var(--main-action-green),
    transparent,
    transparent
  );
}
@keyframes rotate {
  0% {
    --gradient-angle: 0deg;
  }
  100% {
    --gradient-angle: 360deg;
  }
}
</style>
