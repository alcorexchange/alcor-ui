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
            .circle
            .details
                span.title Governance
                span.desc Governance
    .right
        .tab-bar
            .tab.active Allocation
            .tab Release schedule
        .tab Graph goes here
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
  display: flex;
}
.left {
  width: 33.3333%;
}
.right {
  width: 66.66666%;
}
.text {
  font-weight: bold;
  font-size: 3rem;
}
</style>
