const { parentPort, workerData } = require('worker_threads')
const { Token, Pool, computeAllRoutes, Route } = require('@alcorexchange/alcor-swap-sdk')

const { input, output, pools, maxHops } = workerData

const _pools = pools.map(p => Pool.fromBuffer(Buffer.from(p)))

const routes = computeAllRoutes(
  Token.fromJSON(input),
  Token.fromJSON(output),
  _pools,
  maxHops
)

parentPort.postMessage(routes.map(r => Route.toBuffer(r)))
