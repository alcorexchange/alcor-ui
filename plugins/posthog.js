import posthog from 'posthog-js'

export default ({ app }) => {
  if (process.client) {
    posthog.init('phc_g0zl0mmVouAXKt1mlHaXLKJ1wdV2SkAQF5RKH0GR4y2', {
      api_host: 'https://eu.i.posthog.com',
      capture_pageview: false, // We'll capture manually on route change
      persistence: 'localStorage'
    })

    // Capture pageview on route change
    app.router.afterEach((to) => {
      posthog.capture('$pageview', {
        $current_url: window.location.origin + to.fullPath
      })
    })
  }
}
