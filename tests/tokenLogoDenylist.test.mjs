import test from 'node:test'
import assert from 'node:assert/strict'
import { isSuppressedTokenLogo } from '../server/services/tokenLogoDenylist.ts'

const blocked = {
  eosiostokens: ['XBNB', 'XBTC', 'XDOGE', 'XETH', 'XSOL', 'XXLM', 'XXRP'],
  xsvnode: ['LOAN', 'XMONEY', 'XZBCN', 'XSTOCK', 'GOOGLEX', 'AAPLX', 'QQQX', 'XSWAP'],
  'wrap.xpr': ['UNI', 'SUI', 'CC', 'ICP', 'FIL', 'ETC'],
  xrpledgerpro: ['XRPLT', 'XPR'],
}

test('suppress exact XPR token identities, regardless of letter case', () => {
  for (const [contract, symbols] of Object.entries(blocked)) {
    for (const symbol of symbols) {
      assert.equal(isSuppressedTokenLogo('proton', symbol.toLowerCase(), contract), true, `${symbol}@${contract}`)
    }
  }
})

test('do not suppress canonical tokens or other chains', () => {
  for (const [symbol, contract] of [['XBTC', 'xtokens'], ['XETH', 'xtokens'], ['XPR', 'eosio.token'], ['USDC', 'wrap.alcor'], ['OTHER', 'wrap.xpr']]) {
    assert.equal(isSuppressedTokenLogo('proton', symbol, contract), false, `${symbol}@${contract}`)
  }
  assert.equal(isSuppressedTokenLogo('wax', 'XBTC', 'eosiostokens'), false)
})
