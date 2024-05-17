const { parentPort, workerData } = require('worker_threads')
const { Token, Pool, computeAllRoutes, Route } = require('@alcorexchange/alcor-swap-sdk')

const { input, output, POOLS, maxHops } = workerData

const pools = POOLS.map(p => Pool.fromBuffer(Buffer.from(p)))

const routes = computeAllRoutes(
  Token.fromJSON(input),
  Token.fromJSON(output),
  pools,
  maxHops
)

parentPort.postMessage(routes.map(r => Route.toBuffer(r)))
