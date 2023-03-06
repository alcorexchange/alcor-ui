<template lang="pug">
.d-flex.flex-column.gap-10.p-2.br-8.input-step-counter
  .top
    AlcorButton.action.decrease(@click="decrease" iconOnly)
      i.el-icon-minus
    slot(name="top")
    AlcorButton.action.increase(@click="increase" iconOnly)
      i.el-icon-plus
  el-input.input(v-model="localValue" @change="onChange" type="number")
  .fs-12.text-center
    slot
</template>

<script>
import AlcorButton from '@/components/AlcorButton'
export default {
  props: ['value', 'changePercentage'],
  
  components:{
    AlcorButton
  },

  data() {
    return {
      localValue: ''
    }
  },

  watch: {
    value() {
      this.localValue = this.value
    }
  },

  mounted() {
    this.localValue = this.value
  },

  methods: {
    increase(){
      const percentage = parseInt(this.changePercentage) || 5
      const value = parseFloat(this.value)
      const toChange = value + value * percentage / 100
      this.onChange(toChange)
    },
    decrease(){
      const percentage = parseInt(this.changePercentage) || 5
      const value = parseFloat(this.value)
      const toChange = value - value * percentage / 100
      this.onChange(toChange < 0 ? 0 : toChange)
    },
    onChange(event) {
      this.$emit('change', event)

      // Force update lovalvalue in case change value did not had effect
      setTimeout(() => {
        console.log('upd local')
        this.localValue = this.value
      })
    }
  }
}
</script>

<style scoped lang="scss">
.input-step-counter{
  background: var(--selector-bg);
  font-size: 0.86rem;
}
.top{
  display: flex;
  justify-content: space-between;
  gap: 2px;
  align-items: center;
}
.action::v-deep{
  padding: 0;
  font-size: 2rem;
}
.input::v-deep{
  input{
    font-size: 1.6rem;
    text-align: center;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
  }
}
</style>
