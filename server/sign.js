const { TextEncoder, TextDecoder } = require('util')

const fetch = require('node-fetch')
const { BAD_REQUEST, CREATED } = require('http-status-codes')
const { Api, JsonRpc } = require('eosjs')
const { JsSignatureProvider } = require('eosjs/dist/eosjs-jssig')

const network = require('../config.js').networks.eos

const keys = process.env.PAYFORCPUPK ? [process.env.PAYFORCPUPK] : []
const signatureProvider = new JsSignatureProvider(keys)

const rpc = new JsonRpc(`${network.protocol}://${network.host}:${network.port}`, { fetch })
const api = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder() })

const buffer2hex = (buffer) =>
  Array.from(buffer, (x) => ('00' + x.toString(16)).slice(-2)).join('')

// we allow actions on this contract
const ALLOWED_CONTRACTS = ['alcorotcswap', 'eostokensdex']

const checkAction = (action) => {
  switch (action.account) {
    case `eosio.token`: {
      if (!ALLOWED_CONTRACTS.includes(action.data.to)) {
        throw new Error(
          `Free CPU for transfers to other contracts is not granted.`
        )
      }
      return
    }

    // TODO Refactor
    case ALLOWED_CONTRACTS[0]: {
      // any internal action except payforcpu is fine
      // we don't want someone to DDOS by sending only payforcpu actions
      if (action.name === `payforcpu`) {
        throw new Error(`Don't include duplicate payforcpu actions.`)
      }
      return
    }
    case ALLOWED_CONTRACTS[1]: {
      // any internal action except payforcpu is fine
      // we don't want someone to DDOS by sending only payforcpu actions
      if (action.name === `payforcpu`) {
        throw new Error(`Don't include duplicate payforcpu actions.`)
      }
      return
    }

    default: {
      if (action.name == 'transfer' && ALLOWED_CONTRACTS.includes(action.data.to)) return

      throw new Error(
        `Free CPU for actions on ${action.account} is not granted.`
      )
    }
  }
}

const checkTransaction = (tx) => {
  tx.actions.forEach(checkAction)
}

async function sign (req, res) {
  try {
    const { tx, txHeaders = {} } = req.body
    if (!tx || !tx.actions) {
      return res.status(BAD_REQUEST).json({
        error: `No transaction passed`
      })
    }

    checkTransaction(tx)

    // insert cpu payer's payforcpu action as first action to trigger ONLY_BILL_FIRST_AUTHORIZER
    tx.actions.unshift({
      account: ALLOWED_CONTRACTS[1],
      name: 'payforcpu',
      authorization: [
        {
          actor: ALLOWED_CONTRACTS[1],
          permission: `payforcpu`
        }
      ],
      data: {}
    })

    // https://github.com/EOSIO/eosjs/blob/master/src/eosjs-api.ts#L214-L254
    // get the serialized transaction
    let pushTransactionArgs = await api.transact(tx, {
      blocksBehind: txHeaders.blocksBehind,
      expireSeconds: txHeaders.expireSeconds,
      // don't sign yet, as we don't have all keys and signing would fail
      sign: false,
      // don't broadcast yet, merge signatures first
      broadcast: false
    })

    // JSSignatureProvider throws errors when encountering a key that it doesn't have a private key for
    // so we cannot use it for partial signing unless we change requiredKeys
    // https://github.com/EOSIO/eosjs/blob/849c03992e6ce3cb4b6a11bf18ab17b62136e5c9/src/eosjs-jssig.ts#L38
    const availableKeys = await api.signatureProvider.getAvailableKeys()
    const serializedTx = pushTransactionArgs.serializedTransaction
    const signArgs = {
      chainId: network.chainId,
      requiredKeys: availableKeys,
      serializedTransaction: serializedTx,
      abis: []
    }
    pushTransactionArgs = await api.signatureProvider.sign(signArgs)

    const returnValue = {
      ...pushTransactionArgs,
      serializedTransaction: buffer2hex(
        pushTransactionArgs.serializedTransaction
      )
    }
    return res.status(CREATED).json(returnValue)
  } catch (err) {
    console.error(err.message)
    return res.status(BAD_REQUEST).json({
      error: err.message
    })
  }
}

module.exports = sign
