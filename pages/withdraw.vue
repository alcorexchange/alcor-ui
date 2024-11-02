<template lang="pug">
  .withdraw-page
</template>

<script>
import ReturnLink from '@/components/ReturnLink'
import AlcorContainer from '~/components/AlcorContainer.vue'
import PegSelect from '~/components/peg/PegSelect.vue'
import DepositStep from '~/components/peg/DepositStep.vue'
import DepositAddress from '~/components/peg/DepositAddress.vue'
import DepositHistory from '~/components/peg/DepositHistory.vue'
export default {
  name: 'Deposit',
  components: {
    AlcorContainer,
    PegSelect,
    DepositStep,
    DepositAddress,
    ReturnLink,
    DepositHistory,
  },
  data: () => ({}),

  computed: {},

  mounted() {},
  methods: {},
}
</script>

<style lang="scss">
.withraw-page {
  max-width: 800px;
  margin: auto;
  margin-top: 40px;
}
</style>
