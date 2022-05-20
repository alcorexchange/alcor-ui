<template>
  <v-select class="alcor-select" :searchable="false" :clearable="false" :options="options" :value="selected">
    <template #option="option">
      <slot name="option" :option="option" />
    </template>
    <template #selected-option>
      <slot name="selected" />
    </template>
    <template #open-indicator>
      <chevron-icon v-bind="{ ref: 'openIndicator', role: 'presentation', class: 'vs__open-indicator' }" />
    </template>
  </v-select>
</template>

<script>
import ChevronIcon from '~/components/ChevronIcon'

export default {
  components: { ChevronIcon },
  props: ['options', 'selected']
}
</script>

<style>
.alcor-select {
  --vs-controls-color: #282828;
  --vs-border-color: #282828;
  --vs-dropdown-bg: #282828;
  --vs-dropdown-option--active-bg: #232323;

  --vs-selected-color: #eeeeee;
  --vs-dropdown-option--active-color: #eeeeee;

  background-color: #282828;
  border-radius: 2px;
  box-sizing: border-box;
  padding: 0 10px;
}

.vs__dropdown-option:hover {
  background-color: #232323 !important
}
</style>
