const { parentPort, workerData } = require('worker_threads')
const { Token, Pool, computeAllRoutes, Route } = require('@alcorexchange/alcor-swap-sdk')
const workerpool = require('workerpool')



function computeRoutes(input, output, pools, maxHops) {
  //const startTime = performance.now()
  const _pools = pools.map((p) => Pool.fromBuffer(Buffer.from(p)))

  //const endTime = performance.now()
  //const ms = endTime - startTime
  //workerpool.workerEmit({ type: 'log', message: `Преобразовал пулы ${ms}ms` })

  const routes = computeAllRoutes(Token.fromJSON(input), Token.fromJSON(output), _pools, maxHops)
  return routes.map((r) => Route.toBuffer(r))
}

workerpool.worker({
  computeRoutes,
})
