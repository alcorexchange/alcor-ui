<template lang="pug">
  ElDialog(:visible.sync="visible" :title="title" class="announcement-modal")
    .content Some content here ...
</template>

<script>
export default {
  name: 'AnnouncementModal',
  data: () => ({
    id: 'wax-on-usd-notice',
    visible: false,
    title: '🚨 Important Announcement Regarding USDT on WAX 🚨',
  }),

  mounted() {
    this.tryShowModal()
  },

  methods: {
    tryShowModal() {
      this.visible = true
    },
  },
}
</script>

<style lang="scss">
.announcement-modal {
  .el-dialog {
    width: 90%;
    max-width: 600px;
  }
}
</style>
