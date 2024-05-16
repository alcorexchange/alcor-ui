<template>
  <svg
    width="20"
    height="20"
    viewBox="0 0 15 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    @click="$emit('click')"
  >
    <path d="M12.8903 10.8121V2.60889H4.68677" :stroke="color" stroke-linecap="round" stroke-linejoin="round" />
    <path
      d="M10.5465 4.95312H2.34302V13.1562H10.5465V4.95312Z"
      :stroke="color"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>

<script>
export default {
  props: ['color']
}
</script>
