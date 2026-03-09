export const LAUNCHPAD_PREFIX = 'launchpad:v3'

export const LAUNCHPAD_EVENT_CHANNELS = {
  newPool: 'launchpad:v3:event:new_pool',
  tokenUpdate: 'launchpad:v3:event:token_update',
  trade: 'launchpad:v3:event:trade',
  listUpdate: 'launchpad:v3:event:list_update',
  poolLiquidityUpdate: 'launchpad:v3:event:pool_liquidity_update',
}

export function chainPrefix(chain: string) {
  return `${LAUNCHPAD_PREFIX}:${chain}`
}

export function tokenSummaryKey(chain: string, tokenId: string) {
  return `${chainPrefix(chain)}:token:${tokenId}:summary`
}

export function tokenTradesKey(chain: string, tokenId: string) {
  return `${chainPrefix(chain)}:token:${tokenId}:trades`
}

export function tokenBucketsKey(chain: string, tokenId: string) {
  return `${chainPrefix(chain)}:token:${tokenId}:buckets`
}

export function listNewKey(chain: string) {
  return `${chainPrefix(chain)}:list:new`
}

export function listTrendingKey(chain: string) {
  return `${chainPrefix(chain)}:list:trending`
}

export function listOrganicKey(chain: string) {
  return `${chainPrefix(chain)}:list:organic`
}

export function listGraduatedKey(chain: string) {
  return `${chainPrefix(chain)}:list:graduated`
}

export function tokensSetKey(chain: string) {
  return `${chainPrefix(chain)}:tokens`
}

export function dedupeEventKey(chain: string, dedupeId: string) {
  return `${chainPrefix(chain)}:dedupe:${dedupeId}`
}

export function bootStateKey(chain: string) {
  return `${chainPrefix(chain)}:state`
}
