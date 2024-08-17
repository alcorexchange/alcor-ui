process.env.NTBA_FIX_319 = 1
require('dotenv').config()
const log = require('simple-node-logger').createSimpleLogger('project.log')
const { EosAction } = require('./eosAction')

// Constants for time intervals
const ONE_SECOND = 1000 // milliseconds
const TEN_SECONDS = 10 * ONE_SECOND
const ONE_HOUR = 60 * 60 * ONE_SECOND
const ONE_DAY = 24 * ONE_HOUR
const ONE_DAY_AND_TEN_SECONDS = 24 * ONE_HOUR + TEN_SECONDS

// required params
if (!process.env.LSW_NODEOS_ENDPOINT) throw new Error('NODEOS_ENDPOINT is required')
if (!process.env.LSW_CHAIN_ID) throw new Error('CHAIN_ID is required')
if (!process.env.LSW_CONTRACT_ACCOUNT) throw new Error('CONTRACT_ACCOUNT is required')
if (!process.env.LSW_PERMISSION) throw new Error('PERMISSION is required')
if (!process.env.LSW_PRIVATE_KEYS) throw new Error('PRIVATE_KEYS is required')
if (!process.env.LSW_PROXY_NAME) throw new Error('PROXY_NAME is required')

const config = {
  endpoint: process.env.LSW_NODEOS_ENDPOINT,
  chainId: process.env.LSW_CHAIN_ID,
  contractName: process.env.LSW_CONTRACT_ACCOUNT,
  account: process.env.LSW_CONTRACT_ACCOUNT,
  permission: process.env.LSW_PERMISSION,
  privateKey: process.env.LSW_PRIVATE_KEYS,
  proxyName: process.env.LSW_PROXY_NAME,
}

const seconds_per_day = 24 * 3600
const refund_delay_sec = 3 * seconds_per_day

const eosAction = new EosAction(config)

const isObjectEmpty = (objectName) => {
  return Object.keys(objectName).length === 0
}

async function triggerUnstakeBatch() {
  try {
    // trigger unstakeBatch
    const receipt = await eosAction.unstakebatch()
    log.info(
      '[triggerUnstakeBatch] Call unstakeBatch at transaction_id: ' + receipt.transaction_id + ' at ',
      new Date().toJSON()
    )
  } catch (error) {
    log.error('[triggerUnstakeBatch] ' + error.message, ' at ', new Date().toJSON())
  }
}

async function claimAndUpdateVotingReward() {
  try {
    // vote for a proxy
    let receipt = await eosAction.voteproducer(config.contractName, config.proxyName)
    log.info(
      `[claimAndUpdateVotingReward] Vote for Proxy: ${config.proxyName} at transaction_id: ` +
        receipt.transaction_id +
        ' at ',
      new Date().toJSON()
    )
    const response = await eosAction.fetchTable('eosio', 'eosio', 'voters', config.contractName, config.contractName, 1)
    const voters = await response.json()
    if (isObjectEmpty(voters) || voters.rows.length == 0) {
      log.info('[claimAndUpdateVotingReward] No voters table found at ', new Date().toJSON())
      return
    }
    log.info(
      `[claimAndUpdateVotingReward] Last Vote Weight: ${voters.rows[0].last_vote_weight}` + ' at ',
      new Date().toJSON()
    )

    // claim voting reward
    receipt = await eosAction.claimgbmvote(config.contractName)
    log.info(
      '[claimAndUpdateVotingReward] Claim Vote Reward at transaction_id: ' + receipt.transaction_id + ' at ',
      new Date().toJSON()
    )
  } catch (error) {
    log.error('[claimAndUpdateVotingReward] ' + error.message, ' at ', new Date().toJSON())
  }
}

async function refundUnstakingToken() {
  try {
    const eosInfo = await eosAction.getInfo()
    let current_date = new Date(eosInfo.head_block_time + 'Z')
    let current_date_sec_since_epoch = parseInt(current_date.getTime() / 1000)

    const response = await eosAction.fetchTable('eosio', config.contractName, 'refunds', '', '', 1)
    const refunds = await response.json()
    if (isObjectEmpty(refunds) || refunds.rows.length == 0) {
      // log.info('[refundUnstakingToken] No refunds table found at ', new Date().toJSON());
      return
    }

    if (refunds.rows && refunds.rows.length > 0) {
      for (const refund of refunds.rows) {
        let request_date = new Date(refund.request_time + 'Z')
        let request_date_sec_since_epoch = parseInt(request_date.getTime() / 1000)
        if (current_date_sec_since_epoch >= request_date_sec_since_epoch + refund_delay_sec) {
          const receipt = await eosAction.refund(config.contractName)
          log.info(
            '[refundUnstakingToken] Call refund at transaction_id: ' + receipt.transaction_id + ' at ',
            new Date().toJSON()
          )
        }
      }
    }
  } catch (error) {
    log.error('[refundUnstakingToken] ' + error.message, ' at ', new Date().toJSON())
  }
}

async function balanceOf(tokenAccount, user, sym) {
  const response = await eosAction.fetchTable(tokenAccount, user, 'accounts', '', '', 1)
  const accounts = await response.json()
  if (isObjectEmpty(accounts) || accounts.rows.length == 0) {
    log.info('No accounts balance table found at ', new Date().toJSON())
    return
  }
  let balance = 0
  const filteredBalances = accounts.rows.filter((row) => {
    const [amount, symbol] = row.balance.split(' ')
    if (symbol === sym) {
      balance = parseFloat(amount)
      return symbol === sym
    }
  })
  return balance
}

async function botClaim() {
  try {
    // get the latest withdraw
    const response = await eosAction.fetchTable(config.contractName, config.contractName, 'withdraws', '', '', 10)
    const withdraws = await response.json()
    if (isObjectEmpty(withdraws) || withdraws.rows.length == 0) {
      // log.info('[botClaim] No withdraws table found at ', new Date().toJSON());
      return
    }
    if (withdraws.rows && withdraws.rows.length > 0) {
      for (let i = withdraws.rows.length - 1; i >= 0; i--) {
        const withdraw = withdraws.rows[i]
        const [amount, symbol] = withdraw.withdrawToken.quantity.split(' ')
        let withdraw_amount = parseFloat(amount)
        const accountBalance = await balanceOf('eosio.token', config.contractName, 'WAX')
        // bot can claim as long as there are enough available token for withdrawal
        if (accountBalance < withdraw_amount) {
          break
        }
        const receipt = await eosAction.botclaim()
        log.info('[botClaim] Call refund at transaction_id: ' + receipt.transaction_id + ' at ', new Date().toJSON())
      }
    }
  } catch (error) {
    log.error('[botClaim] ' + error.message, ' at ', new Date().toJSON())
  }
}

// Initial call
claimAndUpdateVotingReward()

// call again after 1 day
setTimeout(async function run() {
  await claimAndUpdateVotingReward()
  setTimeout(run, ONE_DAY_AND_TEN_SECONDS)
}, ONE_DAY_AND_TEN_SECONDS)

// Every hour
setInterval(function () {
  triggerUnstakeBatch()
}, ONE_HOUR)

// Every 10 seconds
setInterval(function () {
  refundUnstakingToken()
}, TEN_SECONDS)

// Every 10 seconds
setInterval(function () {
  botClaim()
}, TEN_SECONDS)
