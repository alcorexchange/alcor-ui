<template lang="pug">
.social-items
  a(href="https://t.me/alcorexchange" target="_blank")
    img(src="@/assets/icons/Telegram.svg")
  a(href="https://twitter.com/alcorexchange" target="_blank")
    img(src="@/assets/icons/Twitter.svg")
  a(href="https://discord.gg/Sxum2ETSzq" target="_blank")
    img(src="@/assets/icons/Discord.svg")

</template>

<script>
export default {
  name: 'FooterSocialIcons',
}
</script>

<style scoped lang="scss">
.social-items {
  display: flex;
  align-items: center;
  gap: 8px;
  img {
    width: 24px;
    height: 24px;
  }
}
</style>
