import createHash from 'create-hash'
import { SerialBuffer, createInitialTypes, getTypesFromAbi } from 'enf-eosjs/dist/eosjs-serialize'
import { Api } from 'enf-eosjs'

//eosio name helper functions
const char_to_symbol = c => {
  if (typeof c == 'string') c = c.charCodeAt(0)
  if (c >= 'a'.charCodeAt(0) && c <= 'z'.charCodeAt(0)) return c - 'a'.charCodeAt(0) + 6
  if (c >= '1'.charCodeAt(0) && c <= '5'.charCodeAt(0)) return c - '1'.charCodeAt(0) + 1
  return 0
}

const abis = {}
export async function getReceiptDigest(source, receipt, action, returnValueEnabled) {
  const eosApi = new Api({ rpc: source.rpc })
  const cache = source.name + action.act.account

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

    // For old USDT transfers
    if (action.act.data.xfer.memo === undefined && abiTypes.get('xfer').fields.map(f => f.name).includes('memo')) {
      // Old transfer with new emitxfer
      const abiTypes = getTypesFromAbi(createInitialTypes(), lockAbi)
      const emitxfer = abiTypes.get('emitxfer')

      // We serialize it without memo
      emitxfer.fields[0].type.fields = emitxfer.fields[0].type.fields.filter(f => f.name != 'memo')

      emitxfer.serialize(buff, action.act.data)
    } else {
      abiTypes.get('emitxfer').serialize(buff, action.act.data)
    }

    const serializedTransferData = Buffer.from(buff.asUint8Array()).toString(
      'hex'
    )

    //console.log({ serializedTransferData })

    action.act.hex_data = serializedTransferData

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
