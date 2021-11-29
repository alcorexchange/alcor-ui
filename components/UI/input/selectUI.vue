<template lang="pug">
.block
  input(
    type="checkbox"
    v-model="check"
    true-value="1"
    :id="id"
  )
  label(v-if="$slots" :for="id")
    slot
</template>

<script>
export default {
  props: ['value', 'id'],
  data() {
    return {
      check: this.value
    }
  },
  watch: {
    check(newVal) {
      this.$emit('input', newVal)
    }
  }
}
</script>

<style lang="scss" scoped>
.block {
  display: flex;
  align-items: center;
  gap: 10px;
  input {
    height: 20px;
    width: 20px;
    border: none;
    display: flex;
    justify-content: center;
    align-items: center;
    &[type=checkbox] {
      appearance: none;
      cursor: pointer;
      background-color: rgba(54, 53, 53, 1);
      border-radius: 2px;
    }
    &[type=checkbox]:checked:after {
      content: '';
      width: 60%;
      height: 60%;
      background-color: rgb(163, 163, 163);
      padding: 5px;
      border-radius: 2px;
      display: flex;
    }
  }
  label {
    cursor: pointer;
    text-decoration: underline;
    text-transform: lowercase;
    color: rgba(190, 198, 203, 1);
  }
}
</style>
