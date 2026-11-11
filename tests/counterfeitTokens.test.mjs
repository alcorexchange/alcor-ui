import test from 'node:test'
import assert from 'node:assert/strict'
import { findCounterfeitTokenIds } from '../server/services/counterfeitTokens.ts'

const canonical = ['xpr-eosio.token', 'loan-loan.token']
const bridges = ['xtokens']

const token = id => ({ id, contract: id.split('-').slice(1).join('-') })
const tokens = ids => ids.map(token)

test('a canonical symbol from another contract is counterfeit', () => {
  const ids = ['xpr-eostokens', 'loan-xmetalxpr', 'xusdt-agix', 'xbtc-mockmint']
  const known = tokens(['xpr-eosio.token', 'loan-loan.token', 'xusdt-xtokens', 'xbtc-xtokens', ...ids])
  assert.deepEqual(findCounterfeitTokenIds(canonical, bridges, known), ids)
})

test('every token of a canonical contract is canonical', () => {
  const known = tokens(['xusdt-xtokens', 'xbtc-xtokens', 'metal-xtokens'])
  assert.deepEqual(findCounterfeitTokenIds([], bridges, known), [])
})

test('other symbols are left alone', () => {
  const known = tokens(['xpr-eosio.token', 'xusdt-xtokens', 'xusdtx-agix', 'clan-clanx'])
  assert.deepEqual(findCounterfeitTokenIds(canonical, bridges, known), [])
})

test('nothing canonical flags nothing', () => {
  assert.deepEqual(findCounterfeitTokenIds([], [], tokens(['xusdt-agix'])), [])
})
