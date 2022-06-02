<template lang="pug">
.theme-option.d-flex.align-items-center.theme-option(@click="changeTheme")
  .theme-option__name {{ theme.value }}
  .theme-option__pickers
    .picker-text(
      :style="{ border: `1px solid ${theme.textPicker.border}`, color: `${theme.textPicker.color}` }"
    ) Aa
    .picker-color(v-for="color in theme.colors" :style="{ 'background-color': color }")
</template>

<script lang="ts">
export default {
  props: ['theme'],
  methods: {
    changeTheme() {
      if (this.$colorMode.preference !== this.theme.value)
        this.$colorMode.preference = this.theme.value
    }
  }
}
</script>

<style scoped lang="scss">
.theme-option {
  gap: 8px;
  font-size: 12px;
  justify-content: space-between;

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
