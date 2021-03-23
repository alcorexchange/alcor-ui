<template lang="pug">
  .participate
    SectionTitle Participate in the protocol
    .text Alcor DAO
    .left
        .item
            .circle
            .details
                span.title Governance
                span.desc Governance
        .item
</template>

<script>
import SectionTitle from '@/components/landing/SectionTitle'
export default {
  name: 'ChainTools',
  components: {
    SectionTitle
  },
  data: () => ({})
}
</script>

<style scoped lang="scss">
.participage {
  background: rgba(32, 32, 32, 0.3);
  backdrop-filter: blur(55px);
}
</style>
