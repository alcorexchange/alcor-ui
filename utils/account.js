import { JsonRpc } from 'eosjs'

export async function isAccountExists(account, chain) {
  const rpc = new JsonRpc(`${chain.protocol}://${chain.host}:${chain.port}`, { fetch })

  try {
    await rpc.get_account(account)
    return true
  } catch (e) {
    return false
  }
}
