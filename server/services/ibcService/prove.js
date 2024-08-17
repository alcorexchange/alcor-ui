import WebSocket from 'ws'

import { Api } from 'enf-eosjs'
import { JsSignatureProvider } from 'enf-eosjs/dist/eosjs-jssig'


const IBC_WORKS_ACCOUNTS = {
  eos: 'alcoribcpbot',
  wax: 'alcoribcpbot'
}

const signatureProvider = new JsSignatureProvider([
  process.env.WAX_IBC_WOKERK_KEY,
  process.env.EOS_IBC_WOKERK_KEY
])

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

const arrayToHex = (data) => {
  let result = ''
  for (const x of data) result += ('00' + x.toString(16)).slice(-2)
  return result.toUpperCase()
}

class WsQueue {
  current = 0

  constructor(sockets) {
    this.sockets = sockets
  }

  getSocket() {
    return this.sockets[this.current]
  }

  nextSocket() {
    this.current += 1

    if (this.current > this.sockets.length - 1) this.current = 0

    console.log('IBC NEXT SOCKET ->', this.getSocket())
  }

  getNextSocket() {
    this.nextSocket()
    return this.getSocket()
  }
}

export class IBCTransfer {
  emitxferAction = null

  constructor(source, destination, lockContract, native, onProgress) {
    this.source = source
    this.destination = destination
    this.lockContract = lockContract
    this.native = native
    this.onProgress = onProgress

    this.destinationApi = new Api({ rpc: destination.rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder() })
    this.socketsQueue = new WsQueue(source.ibc.proofSockets)
  }

  async getLastProvenBlock() {
    const lastBlockProved = await this.destination.rpc.get_table_rows({
      code: this.lockContract.bridgeContract, // FIXME Assuming bridge prove contracts has same name on both chains
      table: 'lastproofs',
      scope: this.source.ibc.name,
      limit: 1,
      reverse: true,
    })

    if (lastBlockProved && lastBlockProved.rows[0]) {
      return lastBlockProved.rows[0]
    } else {
      return null
    }
  }

  async submitProofs(destinationActions) {
    const signedDestinationTx = await this.destinationApi.transact({
      actions: destinationActions
    }, { broadcast: false, expireSeconds: 360, blocksBehind: 3 })

    return await this.submitTx(signedDestinationTx, this.destination, 6)
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
    let retries = 5

    while (retries != 0) {
      try {
        return await this.tryWaitForLIB(chain, _tx, packedTx, retry_trx_num_blocks)
      } catch (e) {
        console.log('ibc wait for LIB, retrying', e)
        this.socketsQueue.nextSocket()
      }

      retries--
    }

    throw new Error('IBC wait for LIB error after retries')
  }

  async tryWaitForLIB(chain, _tx, packedTx, retry_trx_num_blocks) {
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
        chain.rpc.nextEndpoint()

        console.log('lost internet, retrying', ex)
      }
    } // end of while
    if (retry_trx_num_blocks) return tx //return tx if we dont need to worry about correct global action

    return new Promise((resolve, reject) => {
      const ws = new WebSocket(this.socketsQueue.getNextSocket())

      ws.addEventListener('error', e => {
        reject(e)
      })

      const timeout = setTimeout(() => {
        reject(new Error('IBC request TIMEOUT'))
      }, 3000)

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
        clearTimeout(timeout)

        let res
        try {
          res = JSON.parse(event.data)
        } catch (e) {
          return reject('IBC SERVER JSON ERROR')
        }

        if (res.type == 'error') {
          return reject(res.error)
        }

        if (!res.txs) {
          return reject('IBC SERVER INVALID RESPONCE')
        }

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

  fetchProof({ type = 'heavyProof', block_to_prove, action, last_proven_block }) {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(this.socketsQueue.getSocket())

      ws.addEventListener('error', e => {
        console.log('on ws error', e)
        ws.close()
        return reject(e)
      })

      const initialCallTimeout = setTimeout(() => {
        console.log('REJECT: IBC request INITIAL_CALL_TIMEOUT')
        // возможно после этого код выполняется
        ws.close()
        return reject(new Error('IBC request INITIAL_CALL_TIMEOUT'))
      }, 3000)

      // TODO catch ibc is whole down
      ws.addEventListener('open', (event) => {
        // connected to websocket server
        const query = { type, block_to_prove }
        if (last_proven_block) query.last_proven_block = last_proven_block
        if (action) query.action_receipt = action.receipt
        ws.send(JSON.stringify(query))
      })

      let inProcessCallTimeout
      //messages from websocket server
      ws.addEventListener('message', (event) => {
        clearTimeout(initialCallTimeout)
        const res = JSON.parse(event.data) // TODO Might be cath JSON parse error
        console.log('proov server message: ', res)

        if (inProcessCallTimeout) {
          clearTimeout(inProcessCallTimeout)
        }

        inProcessCallTimeout = setTimeout(() => {
          console.log('REJECT: IBC request IN_PROCESS_TIMEOUT')
          // If IBC not responding for half minute
          ws.close()
          return reject(new Error('IBC request IN_PROCESS_TIMEOUT'))
        }, 30 * 1000)

        //log non-progress messages from ibc server
        if (res.type == 'error') {
          console.log('res error...')
          return reject(res.error)
        }

        if (res.type !== 'progress')
          console.log('Received message from ibc proof server', res)
        if (res.type == 'progress') {
          if (this.onProgress) this.onProgress(res.progress)
          console.log('progress', res.progress)
        }

        if (res.type !== 'proof') {
          console.log('not a prove return')
          return
        }

        ws.close()
        console.log('ws connection closed')

        let name
        if (type === 'lightProof') name = this.native ? 'issueb' : 'withdrawb'
        else name = !action ? 'checkproofd' : this.native ? 'issuea' : 'withdrawa'

        //handle issue/withdraw if proving transfer/retire 's emitxfer action, else submit block proof to bridge directly (for schedules)
        const actionToSubmit = {
          authorization: [{ actor: IBC_WORKS_ACCOUNTS[this.destination.name], permission: 'active' }],
          name,
          account: !action
            ? this.lockContract.bridgeContract // Chedule prove
            : this.native
              ? this.lockContract.pairedWrapTokenContract
              : this.lockContract.wrapLockContract,
          data: { ...res.proof, prover: IBC_WORKS_ACCOUNTS[this.destination.name] }
        }

        //if proving an action, add action and formatted receipt to actionproof object
        if (action) {
          const auth_sequence = []

          for (const authSequence of action.receipt.auth_sequence)
            auth_sequence.push({
              account: authSequence[0],
              sequence: authSequence[1]
            })

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

        clearTimeout(inProcessCallTimeout)
        return resolve(actionToSubmit)
      })
    })
  }

  async getProof({ type = 'heavyProof', block_to_prove, action, last_proven_block }) {
    let retries = 5

    console.log('get proof start')
    while (retries != 0) {
      try {
        console.log('call fetchProof from while')
        const proof = await this.fetchProof({ type, block_to_prove, action, last_proven_block })
        console.log('getProof retrun', proof)
        return proof
      } catch (e) {
        console.log('ibc get proof err, retrying', e)
        this.socketsQueue.nextSocket()
      }

      retries--
    }

    throw new Error('IBC get proof error after retries')
  }

  async getScheduleProofs(transferBlock) {
    const getProducerScheduleBlock = async (blocknum) => {
      try {
        let header = await this.source.rpc.get_block(blocknum)
        const target_schedule = header.schedule_version

        let min_block = 2
        //fetch last proved block to use as min block for schedule change search
        const lastBlockProved = await this.destination.rpc.get_table_rows({
          //code: this.destination.ibc.bridgeContracts[this.source.ibc.name],
          code: this.lockContract.bridgeContract,
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
            this.source.rpc.nextEndpoint()
          }
        }

        if (blocknum > 1000) blocknum -= 1000

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
          }
        }

        blocknum = header.block_num
        return blocknum
      } catch (ex) {
        this.destination.rpc.nextEndpoint()
        throw new Error(ex)
      }
    }

    const proofs = []
    const bridgeScheduleData = await this.destination.rpc.get_table_rows({
      code: this.lockContract.bridgeContract,
      table: 'schedules',
      scope: this.source.ibc.name,
      limit: 1,
      reverse: true,
      show_payer: false
    })

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

export async function prove(sourceChain, destinationChain, action, lockContract, native) {
  const ibcTransfer = new IBCTransfer(
    sourceChain,
    destinationChain,
    lockContract,
    native,
    (p) => {}
  )

  const last_proven_block = await ibcTransfer.getLastProvenBlock()

  console.log('getScheduleProofs')
  const scheduleProofs =
    (await ibcTransfer.getScheduleProofs(action.trx_id)) || []

  // TODO Popup
  console.log('submitScheduleProofs')
  for (const proof of scheduleProofs) {
    await ibcTransfer.submitProofs([proof])
  }

  const block_num = action.block_num

  const emitxferAction = {
    act: action.act,
    receipt: {
      ...action.receipts[0],
      code_sequence: action.code_sequence,
      abi_sequence: action.abi_sequence,
    }
  }

  const auth_sequence = []

  for (const auth of action.receipts[0].auth_sequence) auth_sequence.push([auth.account, auth.sequence])
  emitxferAction.receipt.auth_sequence = auth_sequence

  const light =
    last_proven_block &&
    last_proven_block.block_height > block_num

  const query = {
    type: light ? 'lightProof' : 'heavyProof',
    action: emitxferAction,
    block_to_prove: block_num //block that includes the emitxfer action we want to prove
  }

  if (light) query.last_proven_block = last_proven_block.block_height

  console.log('getProof')
  const emitxferProof = await ibcTransfer.getProof(query)

  if (light)
    emitxferProof.data.blockproof.root =
      last_proven_block.block_merkle_root

  console.log('submitProofs')
  return await ibcTransfer.submitProofs([emitxferProof])
}
