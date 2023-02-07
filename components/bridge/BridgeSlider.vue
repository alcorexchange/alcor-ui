<template lang="pug">
.d-flex.align-items-center.gap-16.slider.justify-content-center
  .step.d-flex.align-items-center.gap-16(
    v-for="{ id, progress, label, status, message } in steps"
    :class="status"
  )
    .line(v-if="id")
    .dot
      .ellipse(v-if="status === 'active'")
      .label.fs-12 {{ label }}
      .progress-percent.fs-12(v-if="status === 'active'") {{ progress }}%
      .message.fs-12(v-if="status === 'error' && message") {{ message }}

</template>

<script>
export default {
  props: ['steps'],

  mounted() {
    this.$watch(({ steps }) => steps.map(({ status }) => status), statuses => {
      const errorIdx = statuses.findIndex(status => status === 'error')
      if (errorIdx >= 0)
        for (let i = 0; i < errorIdx; i++) {
          this.steps[i].status = 'error'
        }
    }, { immediate: true })
  }
}
</script>

<style lang="scss" scoped>
@keyframes rotate {
  100% {
    transform: rotate(360deg)
  }
}

.slider {
  height: 125px;
}

.step {
  .line {
    height: 2px;
    width: 80px;
    border-radius: 4px;
  }

  .ellipse {

    width: 16px;
    height: 16px;
    border: 2px solid var(--main-green);
    border-radius: 50%;
    border-bottom-color: transparent;
    border-left-color: transparent;

    position: relative;
    left: -5px;
    top: -5px;

    animation: rotate .5s linear infinite;
  }

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    position: relative;

    .label {
      position: absolute;
      top: 15px;
      width: 88px;
      left: -44px;
      text-align: center;
    }

    .progress-percent {
      position: absolute;
      bottom: 15px;
      width: 40px;

      left: -20px;
      text-align: center;
    }

    .message {
      position: absolute;
      bottom: 15px;
      width: 300px;
      left: -150px;
      text-align: center;
    }

  }

  &.waiting>* {
    background: var(--slider-bg);
    color: var(--text-disable);
  }

  &.success>*,
  &.active>* {
    background: var(--main-green);
    color: var(--main-green);
  }

  &.error>* {
    background: var(--main-red);
    color: var(--main-red);
  }

}

.dot {}
</style>
