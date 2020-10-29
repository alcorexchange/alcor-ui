<template lang="pug">
.empty-div
</template>

<script>
export default {
  fetch({ redirect, params }) {
    redirect({ name: 'trade-index-id', params })
  }
}
</script>
