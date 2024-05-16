<template lang="pug">
.card(@click="$emit('click')")
  .content
    header
      slot(name="header")
    main
      slot
  footer
    slot(name="footer")

</template>

<style lang="scss" scoped>
header,
main,
footer {
  width: 100%
}

header,
footer {
  padding: 8px;
}

.card {
  width: 220px;
  height: fit-content;
  background-color: var(--background-color-third);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;

  .content {
    width: 100%;
  }
}
</style>
