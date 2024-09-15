<template lang="pug">
  ElDialog(:visible.sync="visible" :title="title" class="announcement-modal")
    template(#title)
      .pr-4.fs-18.color-wax {{ title }}
    .dialog-content
      .main-content
        p As the EOS network upgrade approaches, there’s a possibility that the IBC (Inter-Blockchain Communication) protocol may stop working temporarily for bridging assets from EOS network.

        p.pt-3.fw-bold We do advice users bridging back assets from EOS network using the IBC to ensure a smooth transition (EOS / WAX) Just in case IBC doesn't work for a while. bridging assets to EOS will keep working.

        p.pt-3 Here’s what you need to know related to USDT provided by Alcor:

        ul.pt-3
          li Your funds are safe: If the IBC protocol is terminated, user funds can be converted 1:1 into a similar stablecoin like WAXUSDT or USDC on the WAX network.
          li No need to worry: We’re committed to making this transition as smooth as possible.

        p.pt-3 For $WOMBAT and $EOS users are also adviced to bridge back by September 25.

        p.pt-3 We’ll keep you updated as more information becomes available. Thank you for your trust and patience!

    template(#footer)
      .dialog-footer
        AlcorButton(@click="closeModal") Close
        AlcorButton(access @click="closeModal({ keepHidden: true })") Hide And Don't Show Again
</template>

<script>
import AlcorButton from '~/components/AlcorButton'
export default {
  name: 'AnnouncementModal',

  components: { AlcorButton },

  data: () => ({
    id: 'wax-on-usd-notice',
    visible: false,
    title: 'Important Announcement Regarding IBC Bridge.',
  }),

  mounted() {
    this.tryShowModal()
  },

  methods: {
    tryShowModal() {
      const keepHidden = localStorage.getItem(`alcor-announcement-${this.id}`)

      if (keepHidden) return
      this.visible = true
    },

    closeModal({ keepHidden } = {}) {
      if (keepHidden) {
        localStorage.setItem(`alcor-announcement-${this.id}`, '1')
      }
      this.visible = false
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

  .dialog-footer {
    display: flex;
    gap: 4px;
    justify-content: flex-end;
  }

  ul {
    li {
      list-style: circle;
      margin-left: 20px;
      padding-top: 8px;
    }
  }
}
</style>
