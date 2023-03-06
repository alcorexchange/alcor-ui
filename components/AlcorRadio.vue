<template>
  <div class="alcor-radio-x ">
    <div class="label" v-if="label">{{ label }}</div>
    <div class="items">
      <label
        v-for="({ value: valuex, text }, i) in items"
        :key="i"
        :class="['item grey-border', { active: valuex === value }]"
      >
        <input
          type="radio"
          :name="name"
          :value="valuex"
          :checked="valuex === value"
          @change="onChange"
        />
        {{ text || valuex }}
      </label>
    </div>
  </div>
</template>

<script>
export default {
  name: "AlcorRadio",
  props: {
    value: {
      type: String,
      default: "",
    },
    name: {
      type: String,
      default: "",
    },
    items: {
      type: Array,
      default: [],
    },
    label: {
      type: String,
      default: "",
    },
  },
  methods: {
    onChange(e) {
      this.$emit("input", e.target.value);
    },
  },
};
</script>

<style scoped lang="scss">
$fsmall: 0.86rem;

.alcor-radio-x {
  user-select: none;
}
.label {
  padding: 2px;
  padding-bottom: 4px;
  display: flex;
  font-size: $fsmall;
}
.items {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.item {
  position: relative;
  display: flex;
  padding: 2px 6px;
  border-radius: 8px;
  cursor: pointer;
  font-size: $fsmall;
  transition: all 0.3s;
  color: var(--text-default);
  &.active {
    background: var(--green);
    color: white;
    border-color:  var(--green);
  }
}
input {
  position: absolute;
  opacity: 0;
  visibility: hidden;
  top: 0;
  left: 0;
  z-index: -1;
}
</style>