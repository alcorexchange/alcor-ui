<script>
// FIXME Delete after some time, legasy route
export default {
  fetch({ redirect, route: { params } }) {
    redirect({ name: 'markets-id', params })
  }
}
</script>
