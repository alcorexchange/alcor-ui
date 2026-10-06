<template lang="pug">
.admin-layout
  .admin-header
    .header-left
      nuxt-link(to="/")
        img.logo(
          v-if="$colorMode.value === 'light'"
          src="~/assets/logos/alcorblack.svg"
          height="32"
        )
        img.logo(
          v-else
          src="~/assets/logos/alcorwhite.svg"
          height="32"
        )
      span.admin-title Admin Panel

    .header-right
      ConnectNav

  AlcorLoading
  ModalsDialog
  ResourcesModal

  .admin-content
    nuxt
</template>

<script>
import ConnectNav from '~/components/layout/ConnectNav'
import AlcorLoading from '~/components/AlcorLoading.vue'
import ModalsDialog from '~/components/modals/ModalsDialog'
import ResourcesModal from '~/components/modals/Resources.vue'

export default {
  components: {
    ConnectNav,
    AlcorLoading,
    ModalsDialog,
    ResourcesModal
  }
}
</script>

<style scoped lang="scss">
.admin-layout {
  min-height: 100vh;
  background: var(--background-color-base);
}

.admin-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: var(--background-color-secondary);
  border-bottom: 1px solid var(--border-color);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.admin-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-default);
}

.admin-content {
  padding: 20px;
}
</style>
