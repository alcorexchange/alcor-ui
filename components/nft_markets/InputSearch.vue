<template lang="pug">
.search-input-group
  img.search-icon(src='~/assets/images/search.svg', alt='')
  input.search-input(
    :value="value"
    @input="debounceInput"
    placeholder='Search name or address'
  )
</template>

<script>

export default {
  props: ['value'],
  data: () => ({ timeout: null }),
  methods: {
    debounceInput({ target }) {
      if (this.timeout) clearTimeout(this.timeout)

      this.timeout = setTimeout(() => {
        this.$emit('input', target.value)
      }, 600)
    }
  }
}
</script>

<style scoped lang="scss">
.search-input-group {
  display: flex;
  align-items: center;
  position: relative;
}

.search-input {
  padding: 5px 35px;
  border-radius: 5px;
  font-size: 14px;
  color: #fff;
  outline: none;
  border: none;
  background-color: var(--btn-default);
}

.search-icon {
  left: 10px;
  position: absolute;
}
</style>
