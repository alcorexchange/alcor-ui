<template lang="pug">
#alcor-tabs-components.d-flex.flex-wrap.gap-28
  alcor-tab-link(v-if="links" v-for="{ route, label } in tabs" :key="label" :to="route") {{ $t(label) }}
</template>

<script>
import AlcorTabLink from '~/components/AlcorTabLink.vue'

export default {
  components: { AlcorTabLink },
  props: ['tabs', 'links']
}
</script>
