import createHash from 'create-hash'
import { SerialBuffer, createInitialTypes, getTypesFromAbi } from 'eosjs/dist/eosjs-serialize'
import { Api } from 'eosjs'

import { captureException } from '@sentry/browser'
import { getProveContract } from '../utils/ibc'

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

const arrayToHex = (data) => {
  let result = ''
  for (const x of data) result += ('00' + x.toString(16)).slice(-2)
  return result.toUpperCase()
}

//eosio name helper functions
const char_to_symbol = c => {
  if (typeof c == 'string') c = c.charCodeAt(0)
  if (c >= 'a'.charCodeAt(0) && c <= 'z'.charCodeAt(0)) return c - 'a'.charCodeAt(0) + 6
  if (c >= '1'.charCodeAt(0) && c <= '5'.charCodeAt(0)) return c - '1'.charCodeAt(0) + 1
  return 0
}

export class IBCTransfer {
  emitxferAction = null

  constructor(source, destination, sourceWallet, destinationWallet, asset, onProgress) {
    this.source = source
    this.destination = destination
    this.asset = asset
    this.sourceWallet = sourceWallet
    this.destinationWallet = destinationWallet
    this.onProgress = onProgress
  }

  getTransferAction({ wrapLockContract, quantity, nativeTokenContract }) {
    return {
      account: nativeTokenContract,
      name: 'transfer',
      authorization: [this.sourceWallet.authorization],
      data: {
        from: this.sourceWallet.name,
        to: wrapLockContract,
        quantity,
        memo: this.destinationWallet.name
      }
    }
  }

  getRetireAction({ sourceTokenContract, quantity }) {
    return {
      account: sourceTokenContract,
      name: 'retire',
      authorization: [this.sourceWallet.authorization],
      data: {
        owner: this.sourceWallet.name,
        quantity,
        beneficiary: this.destinationWallet.name
      }
    }
  }

  async getLastProvenBlock() {
    const lastBlockProved = await this.destination.rpc.get_table_rows({
      code: this.asset.bridgeContract, // TODO Assuming prove contract have same name in both chains. (we need check here)
      table: 'lastproofs',
      scope: this.source.ibc.name,
      limit: 1,
      reverse: true,
      show_payer: false
    })

    if (lastBlockProved && lastBlockProved.rows[0]) {
      return lastBlockProved.rows[0]
    } else {
      return null
    }
  }

  async submitProofs(destinationActions) {
    console.log('destinationActions', destinationActions)
    const signedDestinationTx = await this.destinationWallet.wallet.transact({
      actions: destinationActions
    }, { broadcast: false, expireSeconds: 360, blocksBehind: 3 })
    console.log('signedDestinationTx', signedDestinationTx)

    return await this.submitTx(signedDestinationTx, this.destination, 6)
  }

  async signSourceTrx() {
    const sourceActions = this.asset.native
      ? [this.getTransferAction(this.asset)]
      : [this.getRetireAction(this.asset)]

    const signedTx = await this.sourceWallet.wallet.transact(
      { actions: sourceActions },
      { broadcast: false, expireSeconds: 360, blocksBehind: 3 }
    )

    return signedTx
  }

  findEmitxferAction(tx) {
    let emitxferAction = tx.processed.action_traces.find(
      (r) => r.act.name === 'emitxfer'
    ) //if flattened traces (using send_transaction)

    if (!emitxferAction) {
      //if api returns inline traces within action_trace (using push_transaction) shouldnt be used now
      const lockActionTrace = tx.processed.action_traces.find(
        (r) => r.act.name === 'transfer' || r.act.name === 'retire'
      )
      emitxferAction = lockActionTrace.inline_traces.find(
        (r) => r.act.name === 'emitxfer'
      )
      console.log("!!!!!!!!!!!!!!!Shouldn't happen!!!!!!!!!!!!!!!!")
    }

    return emitxferAction
  }

  async sourceTransfer(signedTx) {
    const { tx, packedTx, leap } = await this.submitTx(signedTx, this.source)
    return { tx, packedTx, leap }
  }

  async submitTx(signedTx, chain, retry_trx_num_blocks = null) {
    const leap = chain.version && chain.version >= 3

    if (leap) {
      //use send transaction2 if available
      // TODO make work for leap

      let obj = {
        signatures: signedTx.signatures,
        compression: signedTx.compression || false,
        packed_trx: arrayToHex(signedTx.resolved.serializedTransaction),
        packed_context_free_data: null
      }

      obj = {
        transaction: obj,
        return_failure_trace: false,
        retry_trx: true,
        retry_trx_num_blocks //if not specified, it defaults to LIB
      }

      return await chain.rpc.send_transaction2(obj)
    }

    const packedTx = {
      signatures: signedTx.signatures,
      serializedTransaction: signedTx.resolved
        ? signedTx.resolved.serializedTransaction
        : signedTx.serializedTransaction
    }

    const tx = await chain.rpc.send_transaction(packedTx)

    return { tx, packedTx, leap }

    //return await this.pushGurantee(chain, tx, retry_trx_num_blocks) // if waiting for lib
  }

  async waitForLIB(chain, _tx, packedTx, retry_trx_num_blocks) {
    let tx = JSON.parse(JSON.stringify(_tx))

    const transaction_id = tx.processed.id
    let finished = false
    let delay = 500
    while (!finished) {
      await sleep(delay)
      delay *= 1.1
      delay = Math.min(delay, 5000)

      try {
        console.log('check block')
        const block = await chain.rpc.get_block(tx.processed.block_num)

        const txFound = block.transactions.find(
          (r) => r.trx.id === transaction_id
        )

        if (txFound) {
          //if tx is in block, check relation to retry_trx_num_blocks
          const headInfo = await chain.rpc.get_info()

          console.log('Blocks passed: ~' + (headInfo.head_block_num - tx.processed.block_num) + '/330', 'LIB: ' + headInfo.last_irreversible_block_num)

          if (
            (!retry_trx_num_blocks &&
              headInfo.last_irreversible_block_num >= tx.processed.block_num) || // passed lib
            (retry_trx_num_blocks &&
              headInfo.head_block_num - tx.processed.block_num >=
                retry_trx_num_blocks) // passed blocks specified
          )
            finished = true
        } else if (!txFound) {
          //if tx is not in block, resubmit packed tx
          try {
            tx = await chain.rpc.send_transaction(packedTx)
            console.log('after dublicate', tx)

            console.log(
              'tx not found in block (fork/stale block), resubmitted tx',
              tx
            )
          } catch (ex) {
            captureException(ex)
            chain.rpc.nextEndpoint()
            //handle duplicate tx error, in case it auto got included in next block than reported, check next block and so on
            console.log(ex)
            //TODO verify exception is duplicate tx error
            tx.processed.block_num++
            console.log(
              'exception resubmitting duplicate tx, incremented block number to find tx',
              tx.processed.block_num
            )
          }
        }
      } catch (ex) {
        captureException(ex)
        chain.rpc.nextEndpoint()

        console.log('lost internet, retrying', ex)
      }
    } // end of while
    if (retry_trx_num_blocks) return tx //return tx if we dont need to worry about correct global action

    return new Promise((resolve, reject) => {
      const ws = new WebSocket(this.source.ibc.proofSocket)

      console.log('getBlockActions', tx.processed.block_num)
      ws.addEventListener('open', (event) =>
        ws.send(
          JSON.stringify({
            type: 'getBlockActions',
            block_to_prove: tx.processed.block_num
          })
        )
      )

      ws.addEventListener('message', (event) => {
        const res = JSON.parse(event.data)
        console.log('res', res)
        const firhoseTx = res.txs.find((r) =>
          r.find((s) => s.transactionId.toLowerCase() === transaction_id.toLowerCase())
        )
        console.log('firhoseTx', firhoseTx)
        const firehoseEmitxfer = firhoseTx.find(
          (r) => r.action.name === 'emitxfer'
        )
        console.log('firehoseEmitxfer', firehoseEmitxfer)
        const emitxferAction = tx.processed.action_traces.find(
          (r) => r.act.name === 'emitxfer'
        )
        console.log(
          'api emitxferAction receipt',
          JSON.parse(JSON.stringify(emitxferAction.receipt))
        )

        emitxferAction.receipt = firehoseEmitxfer.receipt
        const auth_sequence = []
        for (const auth of emitxferAction.receipt.auth_sequence)
          auth_sequence.push([auth.account, auth.sequence])
        emitxferAction.receipt.auth_sequence = auth_sequence
        console.log('bp emitxferAction receipt', firehoseEmitxfer.receipt)
        resolve(tx)
      })
    })
  }

  getProof({ type = 'heavyProof', block_to_prove, action, last_proven_block }) {
    //console.log('get proof txID: ', action?.trx_id)
    console.log('get proof txID: ', action)
    return new Promise((resolve, reject) => {
      //initialize socket to proof server
      const ws = new WebSocket(this.source.ibc.proofSocket)
      ws.addEventListener('open', (event) => {
        // connected to websocket server
        const query = { type, block_to_prove }
        if (last_proven_block) query.last_proven_block = last_proven_block
        if (action) query.action_receipt = action.receipt
        ws.send(JSON.stringify(query))
      })

      //messages from websocket server
      ws.addEventListener('message', (event) => {
        const res = JSON.parse(event.data)
        //log non-progress messages from ibc server
        if (res.type == 'error') return reject(res.error)
        if (res.type !== 'progress')
          console.log('Received message from ibc proof server', res)
        if (res.type == 'progress') {
          if (this.onProgress) this.onProgress(res.progress)
          console.log('progress', res.progress)
        }

        if (res.type !== 'proof') return

        ws.close()

        let name
        if (type === 'lightProof') name = this.asset.native ? 'issueb' : 'withdrawb'
        else name = !action ? 'checkproofd' : this.asset.native ? 'issuea' : 'withdrawa'

        //handle issue/withdraw if proving transfer/retire 's emitxfer action, else submit block proof to bridge directly (for schedules)
        const actionToSubmit = {
          authorization: [this.destinationWallet.authorization],
          name,
          account: !action
            //? this.destination.ibc.bridgeContracts[this.source.ibc.name]
            ? this.asset.bridgeContract
            : this.asset.native
              ? this.asset.pairedWrapTokenContract
              : this.asset.wrapLockContract,
          data: { ...res.proof, prover: this.destinationWallet.name }
        }

        console.log('actionToSubmit', actionToSubmit)

        //if proving an action, add action and formatted receipt to actionproof object
        if (action) {
          const auth_sequence = []

          console.log('1')
          for (const authSequence of action.receipt.auth_sequence)
            auth_sequence.push({
              account: authSequence[0],
              sequence: authSequence[1]
            })

          console.log('2')
          actionToSubmit.data.actionproof = {
            ...res.proof.actionproof,
            action: {
              account: action.act.account,
              name: action.act.name,
              authorization: action.act.authorization,
              data: action.act.hex_data
            },
            receipt: { ...action.receipt, auth_sequence }
          }
        }
        console.log('3')
        resolve(actionToSubmit)
      })
    })
  }

  async getScheduleProofs(transferBlock) {
    const getProducerScheduleBlock = async (blocknum) => {
      try {
        console.log('this.source', this)
        let header = await this.source.rpc.get_block(blocknum)
        const target_schedule = header.schedule_version

        let min_block = 2
        //fetch last proved block to use as min block for schedule change search
        const lastBlockProved = await this.destination.rpc.get_table_rows({
          //code: this.destination.ibc.bridgeContracts[this.source.ibc.name],
          code: this.asset.bridgeContract,
          table: 'lastproofs',
          scope: this.source.ibc.name,
          limit: 1,
          reverse: true,
          show_payer: false
        })

        if (lastBlockProved && lastBlockProved.rows[0])
          min_block = lastBlockProved.rows[0].block_height

        let max_block = blocknum

        //detect active schedule change
        while (max_block - min_block > 1) {
          blocknum = Math.round((max_block + min_block) / 2)
          try {
            header = await this.source.rpc.get_block(blocknum)
            if (header.schedule_version < target_schedule) min_block = blocknum
            else max_block = blocknum
          } catch (ex) {
            captureException(ex)
            this.source.rpc.nextEndpoint()
            console.log('Internet connection lost, retrying')
          }
        }

        if (blocknum > 337) blocknum -= 337

        //search before active schedule change for new_producer_schedule
        while (
          blocknum < max_block &&
          !('new_producer_schedule' in header) &&
          !header.new_producers
        ) {
          try {
            header = await this.source.rpc.get_block(blocknum)
            blocknum++
          } catch (ex) {
            this.source.rpc.nextEndpoint()
            console.log('Internet connection lost, retrying')
          }
        }

        blocknum = header.block_num
        return blocknum
      } catch (ex) {
        captureException(ex)
        this.destination.rpc.nextEndpoint()
        console.log('getProducerScheduleBlock ex', ex)
        throw new Error(ex)
      }
    }

    const proofs = []
    const bridgeScheduleData = await this.destination.rpc.get_table_rows({
      //code: this.destination.ibc.bridgeContracts[this.source.ibc.name],
      code: this.asset.bridgeContract,
      table: 'schedules',
      scope: this.source.ibc.name,
      limit: 1,
      reverse: true,
      show_payer: false
    })

    console.log('bridgeScheduleData', bridgeScheduleData)

    let last_proven_schedule_version = 0
    // if (bridgeScheduleData.rows.length > 0) last_proven_schedule_version = bridgeScheduleData.rows[0].producer_schedule.version;
    if (bridgeScheduleData.rows.length > 0)
      last_proven_schedule_version = bridgeScheduleData.rows[0].version
    if (!last_proven_schedule_version)
      return console.log('No Schedule Found in Contract!')

    console.log('Last proved source schedule:', last_proven_schedule_version)

    const schedule = await this.source.rpc.get_producer_schedule()

    let schedule_version = parseInt(schedule.active.version)
    console.log('Source active schedule:', schedule_version)
    console.log('Pending schedule:', schedule.pending ? 'True' : 'False')

    const head = (await this.source.rpc.get_info()).head_block_num

    let schedule_block = head + 0

    console.log('head', head)

    while (schedule_version > last_proven_schedule_version) {
      const block_num = await getProducerScheduleBlock(schedule_block)
      if (!block_num) return //should never occur

      const proof = await this.getProof({ block_to_prove: block_num })
      schedule_version =
        proof.data.blockproof.blocktoprove.block.header.schedule_version
      schedule_block = block_num
      proofs.unshift(proof)

      // FIXME TEST
      //break
    }

    // check for pending schedule and prove pending schedule if found;
    if (schedule.pending) {
      let newPendingBlockHeader = null
      let currentBlock = transferBlock + 0

      while (!newPendingBlockHeader) {
        try {
          const bHeader = await this.source.rpc.get_block(currentBlock)
          if (bHeader.new_producer_schedule) newPendingBlockHeader = bHeader
          else currentBlock--
        } catch (ex) {
          captureException(ex)
          this.source.rpc.nextEndpoint()
          console.log('Internet connection lost, retrying')
        }
      }

      const pendingProof = await this.getProof({
        block_to_prove: newPendingBlockHeader.block_num
      })

      proofs.push(pendingProof) //push pending after proving active
    }

    return proofs
  }
}

const abis = {}
export async function getReceiptDigest(source, receipt, action, returnValueEnabled) {
  const eosApi = new Api({ rpc: source.rpc })
  const cache = source.name + action.act.name

  const lockAbi = cache in abis ? abis[cache] : await eosApi.getAbi(action.act.account)
  abis[cache] = lockAbi

  const abiTypes = getTypesFromAbi(createInitialTypes(), lockAbi)

  const types = createInitialTypes()
  const eosjsTypes = {
    name: types.get('name'),
    bytes: types.get('bytes'),
    uint8: types.get('uint8'),
    uint16: types.get('uint16'),
    uint32: types.get('uint32'),
    uint64: types.get('uint64'),
    varuint32: types.get('varuint32'),
    checksum256: types.get('checksum256'),
  }

  const { name, uint8, uint64, varuint32, checksum256, bytes } = eosjsTypes

  const nameToUint64 = (s) => {
    let n = 0n
    let i = 0
    for (; i < 12 && s[i]; i++)
      n |=
        BigInt(char_to_symbol(s.charCodeAt(i)) & 0x1f) <<
        BigInt(64 - 5 * (i + 1))
    if (i == 12) n |= BigInt(char_to_symbol(s.charCodeAt(i)) & 0x0f)
    return n.toString()
  }

  const getBaseActionDigest = (a) => {
    const buff = new SerialBuffer({ TextEncoder, TextDecoder })

    uint64.serialize(buff, nameToUint64(a.account))
    uint64.serialize(buff, nameToUint64(a.name))
    varuint32.serialize(buff, a.authorization.length)

    for (let i = 0; i < a.authorization.length; i++) {
      uint64.serialize(buff, nameToUint64(a.authorization[i].actor))
      uint64.serialize(buff, nameToUint64(a.authorization[i].permission))
    }

    return createHash('sha256').update(buff.asUint8Array()).digest('hex')
  }

  const getDataDigest = (act, returnValue) => {
    const buff = new SerialBuffer({ TextEncoder, TextDecoder })
    bytes.serialize(buff, act.hex_data)
    bytes.serialize(buff, returnValue)
    return createHash('sha256').update(buff.asUint8Array()).digest('hex')
  }

  //if act_digest and hex_data is not part of receipt (hyperion) then calculate them
  if (!receipt.act_digest) {
    const buff = new SerialBuffer({ TextEncoder, TextDecoder })
    abiTypes.get('emitxfer').serialize(buff, action.act.data)
    const serializedTransferData = Buffer.from(buff.asUint8Array()).toString(
      'hex'
    )
    action.act.hex_data = serializedTransferData

    receipt.abi_sequence = action.abi_sequence
    receipt.code_sequence = action.code_sequence

    //calculate receipt digest

    if (returnValueEnabled) {
      const base_hash = await getBaseActionDigest(action.act)
      const data_hash = await getDataDigest(action.act, '')

      const buff1 = Buffer.from(base_hash, 'hex')
      const buff2 = Buffer.from(data_hash, 'hex')

      const buffFinal = Buffer.concat([buff1, buff2])
      receipt.act_digest = await createHash('sha256')
        .update(buffFinal)
        .digest('hex')
    } else {
      const actionBuffer = new SerialBuffer({ TextEncoder, TextDecoder })
      const action2 = {
        account: action.act.account,
        name: action.act.name,
        authorization: action.act.authorization,
        data: serializedTransferData,
      }

      abiTypes.get('action').serialize(actionBuffer, action2)
      receipt.act_digest = await createHash('sha256')
        .update(actionBuffer.asUint8Array())
        .digest('hex')
    }
  }

  const buff = new SerialBuffer({ TextEncoder, TextDecoder })

  //handle different formats of receipt for dfuse (camelCase) and nodeos

  //if receipt is in nodeos format, convert to dfuse format
  if (receipt.act_digest && !receipt.digest) {
    const authSequence = []
    for (const auth of receipt.auth_sequence)
      authSequence.push({ accountName: auth.account, sequence: auth.sequence })

    receipt = {
      receiver: receipt.receiver,
      digest: receipt.act_digest,
      globalSequence: parseInt(receipt.global_sequence),
      recvSequence: parseInt(receipt.recv_sequence),
      authSequence,
      codeSequence: action.code_sequence,
      abiSequence: action.abi_sequence,
    }
  }

  name.serialize(buff, receipt.receiver)
  checksum256.serialize(buff, receipt.digest)
  uint64.serialize(buff, receipt.globalSequence)
  uint64.serialize(buff, receipt.recvSequence)

  if (receipt.authSequence) {
    varuint32.serialize(buff, receipt.authSequence.length)
    for (const auth of receipt.authSequence) {
      name.serialize(buff, auth.accountName)
      uint64.serialize(buff, auth.sequence)
    }
  } else varuint32.serialize(buff, 0)

  if (receipt.codeSequence) varuint32.serialize(buff, receipt.codeSequence)
  else varuint32.serialize(buff, 0)

  if (receipt.abiSequence) varuint32.serialize(buff, receipt.abiSequence)
  else varuint32.serialize(buff, 0)

  return await createHash('sha256').update(buff.asUint8Array()).digest('hex')
}
