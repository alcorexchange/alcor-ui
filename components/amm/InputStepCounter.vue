<template lang="pug">
.d-flex.flex-column.gap-12.p-2.br-8.input-step-counter(:class="{ focused, disabled, hasError, readOnly }")
  .top
    AlcorButton.action.decrease(v-if="!readOnly" @click="$emit('change', decrement())" iconOnly)
      i.el-icon-minus
    slot(name="top")
    AlcorButton.action.increase(v-if="!readOnly" @click="$emit('change', increment())" iconOnly)
      i.el-icon-plus
  .input.readOnlyValue(v-if="readOnly") {{ value }}
  el-input.input(v-else v-model="localValue" @change="onChange" type="number" @focus="focused = true" @blur="focused = false" placeholder="0")
  .fs-12.text-center.bottom
    slot
</template>

<script>
import AlcorButton from '@/components/AlcorButton'
export default {
  props: ['value', 'changePercentage', 'increment', 'decrement', 'disabled', 'hasError', 'readOnly'],

  components: {
    AlcorButton
  },

  data() {
    return {
      localValue: '',
      focused: false
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
    onChange(event) {
      this.$emit('change', event)

      // Force update lovalvalue in case change value did not had effect
      setTimeout(() => {
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
  border: 1px solid transparent;
  transition: border 0.3s;
  &:hover{
    border: 1px solid var(--border-color)
  }
  &.focused{
    border: 1px solid var(--border-2-color);
  }
  &.disabled{
    opacity: 0.6;
    pointer-events: none;
  }
  &.hasError{
    border-color: #FF3B30 !important;
  }
}
.top{
  display: flex;
  justify-content: space-between;
  gap: 2px;
  align-items: center;
}
.bottom, .top {
  font-size: 0.8rem;
}
.action::v-deep{
  padding: 0;
  font-size: 2rem;
  width: 24px; height: 24px;
}
.input::v-deep input, .readOnlyValue{
  font-size: 1.2rem;
  text-align: center;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  height: auto;
  line-height: 0;
}
.readOnlyValue{
  line-height: 1;
}
.readOnly{
  .input{
    pointer-events: none;
  }
  .top{
    justify-content: center
  }
}
</style>
