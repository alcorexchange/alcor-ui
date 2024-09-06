<template lang="pug">
  ElDialog(:visible.sync="visible")
    .content Some content here ...
</template>

<script>
export default {
  name: 'AnnouncementModal',
  data: () => ({
    id: 'wax-on-usd-notice',
    visible: false,
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

<style></style>
