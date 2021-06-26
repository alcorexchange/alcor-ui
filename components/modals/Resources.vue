<template lang="pug">
el-dialog(
  title='Network Resources',
  :visible='isActive',
  @close='close',
  width='50%',
  :append-to-body='true'
)
    div
        .title Need resources? Stake WAXP
        .desc Stake CPU and NET to vote and earn rewards. RAM is used for storing data on the blockchain.
        .progresses
            .progress-continaer
                el-progress(:percentage="40" :width="100" type="circle")
                .details
                    .title CPU
                    .total Total Staked: 10 WAX
            .progress-continaer
                el-progress(:percentage="40" :width="100" type="circle")
                .details
                    .title CPU
                    .total Total Staked: 10 WAX
</template>

<script>
import { mapMutations, mapGetters } from 'vuex'

export default {
  computed: {
    ...mapGetters({
      isActive: 'resources/isActive'
    })
  },

  methods: {
    ...mapMutations({
      close: 'resources/CLOSE'
    })
  }
}
</script>

<style lang="scss" scoped>
.title {
  font-weight: bold;
  text-align: center;
  font-size: 1.2rem;
}
.desc {
  text-align: center;
}
.progresses {
  display: flex;
  justify-content: center;
}
.progress-continaer {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 8px;
  > * {
    margin-top: 4px;
  }
}
</style>
