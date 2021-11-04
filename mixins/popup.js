export const popup = {
  methods: {
    showPopupWarning(confInfo, notifyTitle) {
      return this.$confirm(
        confInfo.mess,
        confInfo.title,
        {
          confirmButtonText: 'OK',
          cancelButtonText: 'Cancel',
          type: 'warning'
        }
      )
        .then(() => false)
        .catch(() => {
          this.$notify({
            type: 'info',
            title: notifyTitle,
            message: `${notifyTitle} canceled`
          })
          return true
        })
    }
  }
}
