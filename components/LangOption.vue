<template>
  <div class="d-flex align-items-center lang-option" @click="changeLang">
    <icon :icon="icons[code]" />
    <span>{{ labels[code] }}</span>
  </div>
</template>

<script>
import { Icon } from '@iconify/vue2'
export default {
  components: { Icon },
  props: ['code'],
  data() {
    return {
      icons: {
        en: 'twemoji:flag-for-flag-united-states',
        ru: 'twemoji:flag-russia',
        cn: 'twemoji:flag-china'
      },
      labels: {
        en: 'English (US)',
        ru: 'Russian (RU)',
        cn: 'China (CN)'
      }
    }
  },
  methods: {
    changeLang() {
      this.$router.push(this.switchLocalePath(this.code))
    }
  }
}
</script>
<style>
.lang-option {
  gap: 8px;
  font-size: 12px;
}
</style>
