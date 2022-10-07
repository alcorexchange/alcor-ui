<template>
<svg
    width="9"
    height="10"
    viewBox="0 0 9 10"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    @click="$emit('click')">
<circle cx="4.5" cy="5" r="4" :stroke="color"/>
<path d="M1.6875 7.8125C2.25 7.8125 3.31704 6.6875 4.5 6.6875C5.68296 6.6875 6.75 7.8125 7.3125 7.8125" :stroke="color"/>
<circle cx="4.5" cy="4.4375" r="1.6875" :stroke="color"/>
</svg>

</template>

<script>
export default {
  props: ['color']
}
</script>

