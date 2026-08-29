/**
 * Endpoints for a network, in the order requests should try them.
 *
 * `alcorOnly` keeps just our own nodes, falling back to the full list when the
 * network has none — used where a lagging third-party node would corrupt state.
 * `includeDirect` prepends `<CHAIN>_DIRECT_NODE` from the environment.
 */
export function getNodes(
  network: Network,
  { alcorOnly = false, includeDirect = true }: { alcorOnly?: boolean, includeDirect?: boolean } = {}
): string[] {
  const main = `${network.protocol}://${network.host}:${network.port}`
  const all = [main, ...Object.keys(network.client_nodes || {})]

  let nodes: string[]

  if (alcorOnly) {
    nodes = all.filter(n => n.includes('alcor'))

    if (nodes.length === 0) {
      console.warn('NOT FOUND ALCOR NODE FOR:', network.name)
      nodes = all
    }
  } else {
    nodes = [...all].sort(a => (a.includes('alcor') ? -1 : 1))
  }

  if (includeDirect) {
    const direct = process.env[network.name.toUpperCase() + '_DIRECT_NODE']
    if (direct) nodes = [direct, ...nodes]
  }

  return [...new Set(nodes)]
}
