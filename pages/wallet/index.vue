<script>
export default {
  fetch({ route, redirect }) {
    if (route.path == '/wallet/') redirect('/wallet/tokens')
  }
}
</script>
