<template lang="pug">
  .deposit-step(:class="{ active }")
    .side
      .indicator
        i.el-icon-check
      .line(v-if="!isLast")
    .content
      .title.fs-18.fw-medium {{ title }}
      .py-3
        slot
</template>

<script>
export default {
  name: 'DepositStep',
  props: ['active', 'title', 'isLast'],
}
</script>

<style lang="scss">
.deposit-step {
  display: flex;
  --indicator-height: 28px;
  --main-color: var(--btn-default);
  .side {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
  }
  .indicator {
    width: var(--indicator-height);
    height: var(--indicator-height);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    background: var(--main-color);
    color: black;
  }
  .line {
    width: 2px;
    flex: 1;
    background: var(--main-color);
    border-radius: 2px;
  }
  .content {
    margin-left: 14px;
    flex: 1;
    .title {
      display: flex;
      align-items: center;
      min-height: var(--indicator-height);
      color: var(--text-disable);
    }
  }

  &.active {
    --main-color: var(--main-action-green);
    .title {
      color: var(--text-default);
    }
  }
}
</style>
