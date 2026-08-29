# Контекст для фронта: Wire testnet на бирже

Что нужно, чтобы прикрутить свою Wire-цепь: регистрация, логин кошельком,
начисление монет. Всё ниже проверено на живой цепи 26.08.2026 — где не проверено,
написано явно.

## Что читать ещё

| Файл | О чём |
|---|---|
| [README.md](README.md) | фаусет: API, лимиты, эксплуатация, nginx |
| `claude_cache/wire/WIRE_NOTES.md` | общая картина Wire: ключи, ROA, отличия от Antelope |
| `claude_cache/wire/wire-testnet-node/CHAIN_NOTES.md` | своя цепь: аккаунты, ресурсы, эксплуатация |
| `claude_cache/wire/alcor-v2-swap/deploy/wire.js` | рабочий клиент-пример на Node |

## Бек биржи умеет Wire (29.08.2026)

В `alcor-ui` появился слой `server/services/chain/`, и Wire в нём — первый
не-Antelope чейн. Коммит `45cab4d5`, задеплоен на прод.

**Сеть в конфиге называется `wiretest`** (не `wire`, не `wire-testnet`: имя сети
подставляется в переменную окружения `<NAME>_DIRECT_NODE`, а дефис там невалиден).

Практический смысл для фронта: **ходить в ноду за данными больше не нужно**. Пулы,
позиции, тики, балансы, цены и графики отдаёт обычное API биржи — те же ручки, что
у eos и wax, просто с чейном `wiretest`:

```
GET /api/v2/swap/pools
GET /api/v2/swap/pools/:id/ticks
GET /api/v3/amm/account/:account/positions
GET /api/v2/account/:account/farms
```

Что бек знает про эту цепь:

| | |
|---|---|
| AMM-контракт | `swap.alcor` |
| Токены | `sysio.token` (`SYS`, `WIRE`), `testtoken` (`USDT`, `TEST`) |
| Якорь цены | `USDT` = $1, цены остальных выводятся из пулов |
| Цена `SYS` | зашита `0.42` в конфиге — у него нет пула и его нигде не торгуют |
| Ордербук | **нет.** Спотовые ручки (`/api/v2/markets`, `/api/v2/deals`) для `wiretest` будут пустыми — ордербук пишется заново |

Апдейтер `Alcor-updater-wiretest` на проде поднят (29.08.2026), данные в базу идут.

Чейн определяется **по поддомену** (`networkResolver`, query-параметра для этого
нет), и `wiretest.alcor.exchange` заведён — на нём отдаётся и фронт, и API:

```bash
curl https://wiretest.alcor.exchange/api/v2/swap/pools   # пул USDT/TEST, tvl, тики
curl https://wiretest.alcor.exchange/api/v2/tokens       # usdt-testtoken, test-testtoken
```

## Библиотека

**`@wireio/sdk-core`**, форк wharfkit/antelope. В `alcor-ui` уже стоит (1.0.88),
им подписывает фаусет.

```bash
npm i @wireio/sdk-core
```

⚠️ Его `.d.ts` написаны под TypeScript новее, чем пинит проект, и на 5.0.3 не
парсятся — поэтому в `tsconfig.json` включён `skipLibCheck`.

Не путать с `@wireio/core` 0.4.7 — тот заброшен с апреля, репа мертва.
Исходники живут в монорепе `Wire-Network/wire-libraries-ts`, `packages/sdk-core`.

⚠️ **ESM-билд пакета сломан**: `lib/esm/crypto/Curves.js` делает
`import { ec } from "elliptic"`, а `elliptic` — CommonJS и именованных экспортов
не отдаёт. В Node это падает сразу (`SyntaxError: Named export 'ec' not found`),
поэтому бек написан на `require`. В браузерных сборщиках (Vite/webpack) CJS-интероп
обычно это переваривает, но **проверь импорт первым же коммитом**, до всей остальной
работы — если не заведётся, придётся форсить `lib/cjs` через alias в конфиге.

## Нода: только через `wiretest-api.alcor.exchange`

Напрямую в `http://116.202.36.122:6666` фронт не достучится **по трём
независимым причинам**:

1. **Порт 6666 в блоклисте WHATWG** (наследие IRC). Браузер откажет с
   `ERR_UNSAFE_PORT`, не дойдя до сети. Ровно на этом же споткнулся Node —
   его `fetch` отдаёт `bad port`, из-за чего бек ходит через сырой `http`.
2. **Mixed content** — страница на https не может дёргать http.
3. **CORS** — нода не отдаёт нужные заголовки.

Все три снимает **`https://wiretest-api.alcor.exchange`** — наш nginx перед нодой.
Проверено: `get_info` отдаёт правильный `chain_id`, preflight на
`push_transaction` возвращает 204 с `allow-origin: *`, `allow-headers: *`.

В `config.js` это и есть `host`/`port`/`protocol` сети `wiretest`, поэтому
`this.$rpc` на фронте собирается сам и в коде домен писать не надо. Бек ходит
мимо — у него в `.env` `WIRETEST_DIRECT_NODE` с адресом самой ноды.

Читать цепь через ноду в обычных экранах не нужно: пулы, позиции, тики, балансы
и цены отдаёт API биржи (см. раздел выше). Нода нужна ровно для того, что бек за
юзера сделать не может:

| Что | Куда |
|---|---|
| `push_transaction` | подпись юзера уходит в цепь только с фронта |
| `get_info` | `chain_id` и TAPOS-заголовок для сборки транзакции |
| `get_accounts_by_authorizers` | логин: резолв аккаунта по пабкею кошелька |

## Кошельки: что реально работает

EM и ED проверены пушем настоящей транзакции на живую цепь, K1 работает у бека.
WA не проверялся: подписывать им нечем, в SDK нет клиентской части.

| Тип | Кошелёк | Статус |
|---|---|---|
| **EM** | MetaMask, Rabby, любой EVM | ✅ **работает** |
| K1 | нативные | ✅ работает (сервисные ключи) |
| ED | Phantom, Solflare | ❌ **сломан в SDK** |
| WA | passkey | ❌ подписанта в SDK нет |

**Брать EM.** Цепь сама накрывает дайджест транзакции префиксом EIP-191 и считает
keccak256, то есть MetaMask подписывает обычным `personal_sign` и не догадывается,
что это Wire. Проверено: транзакция дошла до контракта и упала уже на его логике,
то есть авторизация прошла.

**ED не брать.** Цепь ждёт 96-байтную подпись (32 байта пабкея + 64 подписи,
`elliptic_ed.cpp`), а SDK формирует 64 и на ABI отдаёт 65. Живая цепь отвечает
`Invalid ED25519 signature bytes length 65`. Обойти можно только собирая
`SIG_ED_` мимо SDK — парсер там тоже прибит к 64 байтам.

**WA не брать пока.** `KeyType.WA` в SDK есть, но это только сериализация:
ни `navigator.credentials`, ни сборки authData + clientDataJSON. Плюс passkey
жёстко привязан к домену и требует https.

## Регистрация

```js
const res = await fetch("https://wax.alcor.exchange/api/v2/wire-test/register", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ pubkey }),   // PUB_EM_...
})
const { account, created } = await res.json()
```

Лимит — 2 аккаунта на IP за скользящие 24 часа. Коды ответа — в `README.md`.

⚠️ Бить **сразу в `wax.alcor.exchange`**: на `alcor.exchange/api/*` висит
301-редирект Cloudflare, а `fetch` на 301 превращает POST в GET и теряет тело.

### Откуда взять pubkey из MetaMask

Адрес Ethereum — это `keccak(pubkey)[12:]`, обратно пабкей не достаётся. Значит
нужна одна подпись на регистрации:

```js
const sig = await signer.signMessage(msg)                       // personal_sign
const uncompressed = ethers.utils.recoverPublicKey(             // 0x04||x||y, 65 байт
  ethers.utils.hashMessage(msg), sig)
const compressed = ethers.utils.computePublicKey(uncompressed, true)  // 0x02/0x03||x
const pubkey = "PUB_EM_" + compressed.slice(2)                  // без 0x
```

⚠️ **Сжимать обязательно.** SDK принимает для EM только 33-байтный ключ:
`PublicKey.from("PUB_EM_04...")` падает с `Expected 33-byte compressed key for EM,
got 65`. В `WIRE_NOTES.md:122` записано «`PUB_EM_` = `04` + hex» — это от старого
`@wireio/core` 0.4.7 и для 1.0.86 неверно.

Проверено на ethers 5.8.0: собранный так ключ парсится SDK и совпадает
с `toString()` байт-в-байт.

## Логин

Аккаунт резолвится по пабкею, бек для этого не нужен:

```js
POST /v1/chain/get_accounts_by_authorizers  {"keys": ["PUB_EM_..."]}
```

Пусто — значит новый юзер, шлём на `/register`. Ходить туда — в
`https://wiretest-api.alcor.exchange`, то есть тем же `this.$rpc`.

## Подпись транзакций

SDK сам отдаёт байты в том виде, в каком их ждёт конкретный кошелёк:

```js
const info = await client.v1.chain.get_info()
const tx = Transaction.from({ ...info.getTransactionHeader(120), actions })
const { msgDigest, msgBytes } = tx.signingDigest(info.chain_id, KeyType.EM)
// msgBytes для EM = arrayify(hex дайджеста) -> ровно это уходит в personal_sign
```

Дальше из `r`/`s`/`v` собирается 65-байтный буфер `[r(32)‖s(32)‖v(1)]`, где
`v = recoveryParam + 27`, и скармливается SDK:

```js
const sig = Signature.fromRaw(raw65, KeyType.EM)
const signed = SignedTransaction.from({ ...tx, signatures: [sig] })
await client.v1.chain.push_transaction(signed)
```

Рабочий пример на старом SDK — `hello-contract/lib_em.js` (там `Signature.from`
со строкой, потому что object-путь был сломан).

Старый recid-баг (двойное прибавление, `v` 58/59) в 1.0.86 **починен**, костыль
из `lib_em.js` больше не нужен.

## Начисление монет

Есть эндпоинт (29.08.2026):

```js
const res = await fetch("https://wax.alcor.exchange/api/v2/wire-test/faucet", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ account }),
})
const { sent } = await res.json()   // ["1000.0000 USDT", "1000.0000 TEST"]
```

Наливаются те два токена, которыми на этой цепи торгуют, — `testtoken`:

| Символ | Точность | Supply | Эмитент |
|---|---|---|---|
| `USDT` | 4 | 1 000 000 000 | `testtoken` |
| `TEST` | 4 | 1 000 000 000 | `testtoken` |

Лимит — 1 раз на аккаунт и 4 на IP за скользящие 24 часа, суммы и лимиты меняются
в `config.js`, `networks.wiretest.faucet`. Системные `SYS` и `WIRE` (`sysio.token`,
эмитент `sysio`) не наливаются: ресурсы новый аккаунт и так получает политикой ROA,
а торговать на них нечем.

Первый перевод создаёт строку в таблице `accounts` получателя, RAM за неё платит
отправитель.

Отдельным вызовом, а не хвостом `/register`: аккаунт у юзера может уже быть —
залогинился кошельком, ключ привязан, — а монеты кончились.

## Порядок работ

1. Проверить, что `@wireio/sdk-core` вообще импортится в твоей сборке.
2. Логин на MetaMask: подпись → пабкей → `get_accounts_by_authorizers`.
3. Регистрация новых через `/register`, потом `/faucet` на выданный аккаунт.
4. Первая транзакция от лица юзера (`transfer`), чтобы убедиться в подписи.

Экраны с пулами и позициями от этого списка не зависят: они рисуются по API
биржи, которое на `wiretest.alcor.exchange` уже отвечает. Их можно делать
параллельно.
