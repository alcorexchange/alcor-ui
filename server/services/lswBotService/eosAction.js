const { TextDecoder, TextEncoder } = require('util') // node only
const eosjs = require('enf-eosjs')
const { JsSignatureProvider } = require('enf-eosjs/dist/eosjs-jssig') // development only
const fetch = require('cross-fetch')

/* eslint-disable */
class EosAction {
  constructor(config) {
    this.config = config
    const rpc = new eosjs.JsonRpc(config.endpoint, { fetch: config.fetch || fetch })
    this.rpc = rpc
    const defaultPrivateKey = config.privateKey
    const signatureProvider = new JsSignatureProvider([defaultPrivateKey])
    this.eos = new eosjs.Api({ chainId: config.chainId, rpc, signatureProvider, textEncoder: new TextEncoder(), textDecoder: new TextDecoder() })

  }

  async voteproducer(voter, proxy, producers=[]) {
    return await this.pushAction(
      'eosio',
      'voteproducer',
      this.config.account,
      { voter: voter, proxy: proxy, producers: producers },
      this.config.permission
    );
  }

  async claimgbmvote(owner) {
    return await this.pushAction(
      'eosio',
      'claimgbmvote',
      this.config.account,
      { owner: owner},
      this.config.permission
    );
  }

  async refund(owner) {
    return await this.pushAction(
      'eosio',
      'refund',
      this.config.account,
      { owner: owner},
      this.config.permission
    );
  }

  async unstakebatch() {
    return await this.pushAction(
      this.config.contractName,
      'unstakebatch',
      this.config.account,
      {},
      this.config.permission
    );
  }

  async botclaim() {
    return await this.pushAction(
      this.config.contractName,
      'botclaim',
      this.config.account,
      {},
      this.config.permission
    );
  }

  async pushAction(account, action, actor, data, permission = 'active') {
    const actionParams = {
      actions: [{
        account,
        name: action,
        authorization: [{
          actor,
          permission
        }],
        data
      }]
    }
    return await this.eos.transact(
      actionParams,
      {
        blocksBehind: 3,
        expireSeconds: 30
      })
  }

  async getInfo() {
    return await this.eos.rpc.get_info({})
  }

  async fetchTable(account, scope, table, lower_bound, upper_bound, limit, index = "1", key_type = "i64", reverse = "true") {
    return await fetch(this.config.endpoint + `/v1/chain/get_table_rows`, {
      method: 'POST',
      body: JSON.stringify({
        code: account,
        scope: scope,
        table: table,
        lower_bound: lower_bound,
        upper_bound: upper_bound,
        index_position: index,
        key_type: key_type,
        reverse: reverse,
        json: "true",
        limit: limit,
      }),
    });
  }
}

module.exports = {
  EosAction
}
