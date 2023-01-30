<template lang="pug">
.d-flex.gap-32.w-100
  alcor-container
    alcor-tabs(:links="true" :tabs="tabs")
  nuxt-child
</template>

<script>
import AlcorTabs from '~/components/AlcorTabs'

export default {
  components: {
    AlcorTabs
  },
  data: () => ({
    tabs: [{
      label: 'Swap',
      route: { path: '/swap2/swap-tokens' }
    },
    {
      label: 'Manage Liquidity',
      route: { path: '/swap2/manage-liquidity' }
    }]
  })
}
</script>
