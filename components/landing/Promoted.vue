<template lang="pug">
.promouted-markets
  | promouted market

  Spacer
</template>

<script>
import { mapGetters } from 'vuex'
import Spacer from '@/components/Spacer.vue'

export default {
  components: { Spacer },
  props: ['id'],
  computed: {
    ...mapGetters({
      pair: 'swap/getById',
      promoted: 'promoted'
    })
  },
  mounted() {
  },
  watch: {
    '$store.state.swap.pairs'() {
      console.log(this.pair(this.promoted[0]))
    }
  }

}
</script>
