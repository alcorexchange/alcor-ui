const { Api } = require('enf-eosjs')

export async function decodeActionData(hexData, abi, actionName) {
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
