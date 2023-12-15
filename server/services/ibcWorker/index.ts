import axios from "axios"


import { SymbolCode } from 'eos-common'

import { networks } from '../../../config'

import { getMultyEndRpc } from '../../../utils/eosjs'
import { nameToUint64 } from '../../../utils'
import { getAllLockContracts } from '../../../utils/ibc'

const IBC_CHAINS = ['wax']

async function main() {
  const chains = IBC_CHAINS.map(c => networks[c])

  console.log({ chains })
}

main()
