<template lang="pug">
.theme-option.d-flex.align-items-center.theme-option(@click="changeTheme" @touchstart="changeTheme")
  .theme-option__name {{ theme.value }}
  .theme-option__pickers
    .picker-text(
      :style="{ background: `${theme.textPicker.bg}`, color: `${theme.textPicker.color}` }"
    ) Aa
    .picker-color(v-for="color in theme.colors" :style="{ 'background-color': color }")
</template>

<script lang="ts">
export default {
  props: ['theme'],
  methods: {
    changeTheme() {
      this.$emit('click', this.theme.value.toLowerCase())
    }
  }
}
</script>

<style scoped lang="scss">
.theme-option {
  gap: 8px;
  font-size: 12px;
  justify-content: space-between;
  width: 235px;

  &__pickers {
    display: flex;
    justify-content: space-around;
    align-items: center;
    gap: 8px;
    margin-right: 8px;

    .picker-text {
      background-color: #000;
      width: 19px;
      height: 18px;
      text-align: center;
    }

    .picker-color {
      width: 16px;
      height: 16px;
    }
  }
}
</style>
