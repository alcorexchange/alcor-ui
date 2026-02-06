<template lang="pug">
.migration-banner(v-if="!dismissed")
  .banner-content
    span.banner-text
      | New Alcor Exchange is live! Faster, better UI, new features.
    a.banner-link(:href="newAlcorUrl" target="_blank" rel="noopener")
      | Try it now
      i.el-icon-right
  button.banner-close(@click="dismiss" aria-label="Close")
    i.el-icon-close
</template>

<script>
const STORAGE_KEY = 'alcor_migration_banner_dismissed_at'
const DAYS_TO_SHOW_AGAIN = 3

export default {
  data() {
    return {
      dismissed: true,
    }
  },

  computed: {
    newAlcorUrl() {
      const network = this.$store.state.network.name
      return `https://alcor.exchange/v/${network}`
    },
  },

  mounted() {
    const dismissedAt = localStorage.getItem(STORAGE_KEY)
    if (!dismissedAt) {
      this.dismissed = false
      return
    }

    const daysPassed = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24)
    this.dismissed = daysPassed < DAYS_TO_SHOW_AGAIN
  },

  methods: {
    dismiss() {
      this.dismissed = true
      localStorage.setItem(STORAGE_KEY, Date.now().toString())
    },
  },
}
</script>

<style scoped lang="scss">
.migration-banner {
  background: linear-gradient(90deg, #1a1a2e 0%, #16213e 100%);
  color: white;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  position: relative;
  z-index: 1000;
}

.banner-content {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: center;
}

.banner-text {
  font-size: 14px;
  font-weight: 500;
}

.banner-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  padding: 6px 14px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 13px;
  transition: background 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    color: white;
  }
}

.banner-close {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: color 0.2s;

  &:hover {
    color: white;
  }
}

@media (max-width: 600px) {
  .migration-banner {
    padding: 8px 40px 8px 12px;
  }

  .banner-content {
    gap: 8px;
  }

  .banner-text {
    font-size: 12px;
    text-align: center;
  }

  .banner-link {
    font-size: 12px;
    padding: 5px 10px;
  }
}
</style>
