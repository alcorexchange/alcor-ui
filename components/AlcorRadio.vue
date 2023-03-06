<template>
  <div class="alcor-radio">
    <div class="label" v-if="label">{{ label }}</div>
    <div class="items">
      <label
        v-for="({ value: valuex, text }, i) in items"
        :key="i"
        :class="['item', { active: valuex === value }]"
        v-ripple
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
.alcor-radio {
  user-select: none;
}
.label {
  padding: 2px;
  padding-bottom: $p;
  display: flex;
  font-size: $fsmall;
}
.items {
  display: flex;
  flex-wrap: wrap;
  gap: $p;
}
.item {
  position: relative;
  display: flex;
  padding: $p $p2;
  border-radius: $radius;
  cursor: pointer;
  font-size: $fsmall;
  transition: all $duration;
  border: 1px solid $cancel;
  color: $cancel;
  &.active {
    background: $prm;
    color: white;
    border-color: $prm;
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