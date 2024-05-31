<template lang="pug">
.social-items
  a(href="https://t.me/alcorexchange" target="_blank")
    img(src="@/assets/icons/Telegram.svg")
  a(href="https://twitter.com/alcorexchange" target="_blank")
    img(src="@/assets/icons/Twitter.svg")
  a(href="https://discord.gg/Sxum2ETSzq" target="_blank")
    img(src="@/assets/icons/Discord.svg")
  a(href="https://github.com/alcorexchange/alcor-ui" target="_blank" class="github")
    img(src="@/assets/icons/Github.svg")

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
  .github {
    background: white;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    img {
      width: 18px;
      height: 18px;
    }
  }
}
</style>
