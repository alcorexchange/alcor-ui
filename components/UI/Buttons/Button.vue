<template lang="pug">
  button(:class="type")
    slot
</template>

<script>
export default {
  props: ['title', 'type']
}
</script>

<style lang="scss" scoped>
  button {
    width: 100%;
    border: none;
    padding: 5px;
    border-radius: 2px;
    font-weight: normal;
    transition: .4s;
    color: #000000;
    text-transform: capitalize;
    &.success {
      background-color: #aed581;
      &-outline {
        background-color: #212121;
        border: 1px solid #aed581;
        color: #fafafa;
        &:hover {
          background-color: #aed581;
        }
      }
      &:hover {
        background-color: rgb(197 225 165);
      }
    }
    &.danger {
      background-color: #e57373;
      &-outline {
        background-color: #212121;
        border: 1px solid #e57373;
        color: #fafafa;
        &:hover {
          background-color: #e57373;
        }
      }
      &:hover {
        background-color: rgb(239 154 154);
      }
    }
  }
</style>
