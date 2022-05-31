<template lang="pug">
#cover-img.skeleton(
  :style='{ width: width ? width + "px" : "220px", height: height ? height + "px" : "100%" }'
)
</template>

<script>
export default {
  props: {
    width: Number,
    height: Number,
  },
}
</script>
<style lang="scss" scoped>
#cover-img {
  -o-object-fit: cover;
  object-fit: cover;
  margin: auto;
  border-radius: 5px;
}
.skeleton {
  -webkit-animation: skeleton-loading 1s linear infinite alternate;
  animation: skeleton-loading 1s linear infinite alternate;
}
@-webkit-keyframes skeleton-loading {
  0% {
    background-color: #4d4d4d70;
  }
  100% {
    background-color: #3f3f3f71;
  }
}

@keyframes skeleton-loading {
  0% {
    background-color: #4d4d4d70;
  }
  100% {
    background-color: #3f3f3f71;
  }
}
</style>
