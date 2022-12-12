<template>
  <svg width="9" height="12" viewBox="0 0 9 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 0.5V11.5" :stroke="color" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M1 6H6" :stroke="color" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M4 4L6 6L4 8" :stroke="color" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
</template>


<script>
export default {
  props: ['color']
}
</script>
