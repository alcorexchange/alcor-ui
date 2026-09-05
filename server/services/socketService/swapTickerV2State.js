const latestTickV2ByKey = new Map()

export function makeSwapTickerV2Key(chain, poolId, resolution) {
  return `${chain}:${poolId}:${resolution}`
}

export function setSwapTickerV2Snapshot(key, tick) {
  latestTickV2ByKey.set(key, tick)
}

export function getSwapTickerV2Snapshot(key) {
  return latestTickV2ByKey.get(key)
}
