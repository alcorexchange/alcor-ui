<template lang="pug">
#alcor-tabs-components.d-flex.flex-wrap.gap-28(v-if="links")
  alcor-tab-link(v-for="{ route, label, exact } in tabs" :key="label" :to="route" :exact="exact") {{ $t(label) }}
</template>

<script>
import AlcorTabLink from '~/components/AlcorTabLink.vue'

export default {
  components: { AlcorTabLink },
  props: ['tabs', 'links']
}
</script>
