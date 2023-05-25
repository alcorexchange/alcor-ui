export function getAllLockContracts(network) {
  const { wrapLockContracts } = network.ibc

  const wrapLockContractsArray = []

  for (const proveContract in wrapLockContracts) {
    wrapLockContractsArray.push(...wrapLockContracts[proveContract])
  }

  return wrapLockContractsArray
}

export function getProveContract(network, wrapLockContract) {
  const { wrapLockContracts } = network.ibc

  for (const proveContract in wrapLockContracts) {
    if (wrapLockContracts[proveContract].includes(wrapLockContract)) {
      return proveContract
    }
  }

  throw new Error('no prove contract found')
}
