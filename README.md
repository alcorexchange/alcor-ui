[<img src="https://raw.githubusercontent.com/avral/alcor-ui/master/assets/logos/alcorblack2.svg" height=150>](https://alcor.exchange)

The first listing free decentralized exchange.

![Alcor](https://ipfs.io/ipfs/QmXXP1YbWHtdcyTXmWE7LvwVqGne7TCxQVugMU1jhGHL3S)

With Alcor Exchange you can trade any EOS.IO tokens for system EOS tokens, atomically, without the participation of third parties! The tokens should comply with the standard eosio.token of the contract.

Props:
1. Fully-onchain.
2. NO FEES!
3. Free CPU program.
4. Open Source.

[Join our telegram!](https://t.me/alcorexchange)

## Chains:
1. EOS Mainnet
2. WAX
3. Telos
4. Coffee

## Technologies:
1. [Hyperion](https://github.com/eosrio/Hyperion-History-API)
2. [EOSIO Light API](https://github.com/cc32d9/eosio_light_api)
3. [Bloks.io](https://bloks.io/)

## Instructions for manual use.
#### Open new market:
Send 3.0000 EOS to **eostokensdex** with memo: "new_market|0.token_precision token_symbol@token_contract"

Example memo: ```"new_market|0.00000000 WEED@weedcashnt"```


#### Submit order:
Send the amount you want to sell, and specify the amount you want to get in the memo, the price and market will be automatically determined in the contract.
Memo format(ask token): ```token_amount token_symbol@token_contract```

Example: ```transfer "0.7000 EOS" to eostokensdex with memo "1000.0000 TKT@eossanguotkt"```

#### Order cancelation
Call action ```cancelsell``` or ```cancelbuy``` with parameters:
executor: order owner
market_id:
order_id:

Example
```
executor: avral.pro
market_id: 32
order_id: 3
```
[Cancelbuy](https://bloks.io/account/eostokensdex?loadContract=true&tab=Actions&table=markets&account=eostokensdex&scope=eostokensdex&limit=100&action=cancelbuy)

[Cancelsell](https://bloks.io/account/eostokensdex?loadContract=true&tab=Actions&table=markets&account=eostokensdex&scope=eostokensdex&limit=100&action=buyreceipt)

[Orders and markets possible to see at contact tables](https://bloks.io/account/eostokensdex?loadContract=true&tab=Tables&table=markets&account=eostokensdex&scope=eostokensdex&limit=100)

## Build Setup

``` bash
# install dependencies
$ yarn install

# serve with hot reload at localhost:3000
$ NETWORK=<eos/jungle/local> yarn run dev

# build for production and launch server
$ NETWORK=<eos/jungle/local> yarn run build
$ yarn start

# generate static project
$ yarn run generate
```

## Created:
[Avral's digital lab](https://avral.pro)


