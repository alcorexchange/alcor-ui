const { Api } = require('enf-eosjs')

function isHexString(str) {
  if (typeof str !== 'string') return false
  return /^[0-9a-fA-F]+$/.test(str)
}

export async function decodeActionData(hexData, abi, actionName) {
  if (!isHexString(hexData)) {
    // If it's already deserialized
    return hexData
  }

  // Initialize the eosjs API with the given ABI
  const api = new Api({
    abiProvider: {
      getRawAbi: (accountName) => abi,
    },
    textDecoder: new TextDecoder(),
    textEncoder: new TextEncoder(),
  })

  // Decode the hex data using eosjs API
  const buffer = Buffer.from(hexData, 'hex')
  const data = await api.deserializeActions([
    {
      account: '',
      name: actionName,
      authorization: [],
      data: buffer,
    },
  ])

  return data[0].data
}
