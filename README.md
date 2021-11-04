Project is Hiring Full-Stack Dev NOW! Good payment in cryptocurrency! Contact: [@avral](https://t.me/avral)
--
# The first listing free decentralized exchange.
Documentation: [docs.alcor.exchange](https://docs.alcor.exchange)

![Alcor Exchange](https://i.imgur.com/brvzFdi.png)

With Alcor Exchange you can trade any EOS.IO tokens for system EOS tokens, atomically, without the participation of third parties! The token's contract should comply with the [eosio.token](https://github.com/EOSIO/eosio.contracts/tree/master/contracts/eosio.token) standard or be a [Simple Assets](https://github.com/CryptoLions/SimpleAssets) fungible token.

Props:
1. Fully-onchain.
2. Free CPU program.
3. Open Source.


[Join our telegram!](https://t.me/alcorexchange)

## Chains:
1. EOS Mainnet
2. WAX
3. Telos
4. Proton

## Technologies:
1. [Hyperion](https://github.com/eosrio/Hyperion-History-API)
2. [EOSIO Light API](https://github.com/cc32d9/eosio_light_api)
3. [Bloks.io](https://bloks.io/)
4. [Greymass Full-History NODE API](https://greymass.com/)

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

# Docker run:
docker run -d --restart=unless-stopped -p 127.0.0.1:27017:27017 --name mongo -m=3g mongo:4.4 --bind_ip 0.0.0.0

docker run -it -p 7002:7000 --restart=unless-stopped -d --label=com.centurylinklabs.watchtower.lifecycle.post-check="rm -rf /data/nginx/cache/eostokens && service nginx reload" --label=com.centurylinklabs.watchtower.enable=true --name alcor-ui --add-host=host.docker.internal:172.17.0.9 avral/alcor-ui
```

## Created:
[Avral's digital lab](https://avral.pro)