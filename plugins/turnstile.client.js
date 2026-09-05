export default () => {
  if (process.client && !process.env.isDev) {
    // Load Turnstile script with explicit rendering
    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    script.defer = true
    document.head.appendChild(script)

    script.onload = () => {
      // Wait until the API is ready
      if (window.turnstile) {
        const container = document.createElement('div')
        container.id = 'turnstile-container'
        document.body.appendChild(container)

        // Render invisible widget
        window.turnstile.render('#turnstile-container', {
          sitekey: '0x4AAAAAABx17rsKcbIpG5XU',
          size: 'invisible',
          callback: (token) => {
            console.log('Turnstile success, token:', token)
            // Если pre-clearance включен, тут уже поставится cf_clearance cookie
          }
        })
      } else {
        console.error('Turnstile script loaded, but API not available')
      }
    }
  }
}
