import test from 'node:test'
import assert from 'node:assert/strict'
import { findCounterfeitTokenIds } from '../server/services/counterfeitTokens.ts'

const canonical = ['xpr-eosio.token', 'loan-loan.token', 'xusdt-xtokens', 'xusdc-xtokens']

test('a canonical symbol from another contract is counterfeit', () => {
  const ids = ['xusdt-agix', 'xusdc-xmetalxpr', 'loan-xmetalxpr', 'xpr-eostokens']
  assert.deepEqual(findCounterfeitTokenIds(canonical, ids), ids)
})

test('canonical tokens and other symbols are left alone', () => {
  const ids = ['xpr-eosio.token', 'xusdt-xtokens', 'loan-loan.token', 'metal-xtokens', 'xusdtx-agix']
  assert.deepEqual(findCounterfeitTokenIds(canonical, ids), [])
})

test('no canonical tokens flags nothing', () => {
  assert.deepEqual(findCounterfeitTokenIds([], ['xusdt-agix']), [])
})
