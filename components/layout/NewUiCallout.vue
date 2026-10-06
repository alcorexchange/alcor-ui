<template lang="pug">
a.new-ui-callout(:href="url" target="_blank" rel="noopener")
  .callout-mark
    i.el-icon-magic-stick
  .callout-body
    span.callout-title {{ title }}
    span.callout-text(v-if="text") {{ text }}
  span.callout-cta
    | {{ cta }}
    i.el-icon-right
</template>

<script>
import { newAlcorUrl } from '~/utils/newAlcor'

export default {
  name: 'NewUiCallout',

  props: {
    /** Path under the venue on the new frontend, e.g. `/swap/farms` */
    path: { type: String, required: true },
    title: { type: String, required: true },
    text: { type: String, default: '' },
    cta: { type: String, default: 'Open' },
  },

  computed: {
    url() {
      return newAlcorUrl(this.$store.state.network.name, this.path)
    },
  },
}
</script>

<style scoped lang="scss">
.new-ui-callout {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border: 1px solid var(--btn-default);
  border-left: 2px solid var(--main-action-green);
  border-radius: var(--radius);
  background: var(--background-color-base);
  color: var(--text-default);
  transition: border-color 0.2s, background 0.2s;

  &:hover {
    background: var(--hover);
    border-color: var(--main-action-green);
    color: var(--text-default);

    .callout-cta {
      color: var(--main-action-green);
    }
  }
}

.callout-mark {
  display: flex;
  align-items: center;
  color: var(--main-action-green);
  font-size: 16px;
}

.callout-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.callout-title {
  font-size: 13px;
  font-weight: 600;
}

.callout-text {
  font-size: 12px;
  color: var(--text-disable);
}

.callout-cta {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  transition: color 0.2s;
}

@media only screen and (max-width: 600px) {
  .new-ui-callout {
    gap: 10px;
    padding: 10px 12px;
  }

  .callout-text {
    display: none;
  }
}
</style>
