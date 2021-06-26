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
                el-progress(:percentage="80" :width="100" type="circle" color="var(--main-green)")
                .details
                    .title CPU
                    .total Total Staked: 10 WAX
            .progress-continaer
                el-progress(:percentage="40" :width="100" type="circle" color="var(--main-green)")
                .details
                    .title NET
                    .total Total Staked: 10 WAX
            .progress-continaer
                el-progress(:percentage="40" :width="100" type="circle" color="var(--main-green)")
                .details
                    .title RAM
                    .total Total Staked: 10 WAX
        .add-resources
            el-select.select(v-model="selectedResource")
                el-option(v-for="{name} in resources" :Label="name" :value="name")
            el-input.input(v-model="amount" placeholder="Amount Of WAXP")
            AlcorButton Stake
</template>

<script>
import { mapMutations, mapGetters } from 'vuex'
import AlcorButton from '@/components/AlcorButton.vue'

export default {
  components: {
    AlcorButton
  },
  data: () => ({
    resources: [{ name: 'CPU' }, { name: 'NET' }, { name: 'RAM' }],
    selectedResource: 'CPU',
    amount: 0.0
  }),
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
  margin-bottom: 4px;
}
.desc {
  text-align: center;
}
.progresses {
  display: flex;
  justify-content: center;
  margin: 8px 0;
  flex-wrap: wrap;
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
.add-resources {
  display: flex;
  align-items: center;
  margin: auto;
  margin-top: 8px;
  max-width: 400px;
  .select {
    width: 80px;
  }
  .input {
    flex: 1;
    margin: 0 8px;
  }
}
@media only screen and (max-width: 640px) {
  .title {
    font-size: 1.08rem;
  }
  .add-resources {
    .input {
      margin: 0 4px;
    }
  }
}
</style>
