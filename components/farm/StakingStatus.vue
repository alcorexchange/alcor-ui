<template lang="pug">
.staking-status(:class="{ status }" :style="{'--color': renderColor}")
  .the-dot(v-if="status != null")
  span {{ renderText }}
</template>

<script>
export default {
  name: 'StakingStatus',
  props: ['status', 'finished'], //status: 'staking', 'partiallyStaked', 'notStaked',

  computed: {
    renderColor() {
      if (this.finished) {
        if (this.status === 'staked') return 'var(--main-action-red)'
        if (this.status === 'partiallyStaked') return 'var(--main-yellow)'
        return 'var(--main-action-green)'
      }

      if (this.status === 'staked') return 'var(--main-action-green)'
      if (this.status === 'partiallyStaked') return 'var(--main-yellow)'
      return 'var(--main-action-red)'
    },

    renderText() {
      if (this.status == null) return ''
      if (this.status === 'staked') return 'Staking'
      if (this.status === 'partiallyStaked') return 'Partially Staked'
      return 'Not Staked'
    },
  },
}
</script>

<style scoped lang="scss">
.staking-status {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--color);
}
.the-dot {
  background: var(--color);
  width: 4px;
  height: 4px;
  border-radius: 4px;
  animation: slow-blink 3s linear infinite;
}

@keyframes slow-blink {
  0% {
    opacity: 1;
  }
  40% {
    opacity: 0;
  }
  70% {
    opacity: 1;
  }
  100% {
    opacity: 1;
  }
}
</style>
