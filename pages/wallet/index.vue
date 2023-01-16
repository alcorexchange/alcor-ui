<script>
export default {
  mounted() {
    this.$router.push({
      name: `wallet-tokens___${this.$i18n.locale}`
    })
  }
}
</script>
