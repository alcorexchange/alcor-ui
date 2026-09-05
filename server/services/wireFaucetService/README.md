# wireFaucetService

Фаусет своей Wire-цепи: заводит аккаунт под ключ кошелька и наливает тестовых
токенов. Раньше жил отдельным репозиторием `register-backend` в докере, с 29.08.2026
это обычный pm2-сервис здесь.

Про сам чейн — `claude_cache/wire/wire-testnet-node/CHAIN_NOTES.md`, про интеграцию
на фронте — [FRONTEND.md](FRONTEND.md).

## API

Наружу торчит через nginx: `/api/v2/wire-test/*` → `127.0.0.1:3100/*`.

```bash
curl -X POST https://wax.alcor.exchange/api/v2/wire-test/register \
  -H 'content-type: application/json' -d '{"pubkey":"PUB_EM_..."}'

curl -X POST https://wax.alcor.exchange/api/v2/wire-test/faucet \
  -H 'content-type: application/json' -d '{"account":"wireno.prs4c"}'
```

⚠️ Бить надо **сразу в `wax.alcor.exchange`**. На `alcor.exchange/api/v2/*` висит
редирект Cloudflare (301) на этот сабдомен, а curl и `fetch` на 301 превращают
POST в GET и теряют тело.

### `POST /register`

```json
{ "account": "wireno.prs4c", "pubkey": "PUB_EM_...", "policy": true, "created": true }
```

| Ответ | Что значит |
|---|---|
| `200`, `created: true` | аккаунт создан, ресурсы выданы |
| `200`, `created: false` | ключ уже привязан, отдан существующий аккаунт (слот не потрачен) |
| `207`, `policy: false` | аккаунт создан, но `addpolicy` упал — чинить `expandpolicy` вручную |
| `400` | пабкей не парсится |
| `429` | лимит по IP |
| `502` | `newuser` не прошёл (обычно кончился резерв issuer'а) |

Ключ принимается любого типа: `PUB_ED_`, `PUB_EM_` (MetaMask), `PUB_K1_`, `PUB_WA_` —
поле `pubkey` в `newuser` имеет ABI-тип `public_key`, а это вариант из шести типов.
Что из этого реально умеет подписывать — таблица в FRONTEND.md.

### `POST /faucet`

```json
{ "account": "wireno.prs4c", "sent": ["1000.0000 USDT", "1000.0000 TEST"] }
```

| Ответ | Что значит |
|---|---|
| `400` | имя не похоже на `name` |
| `404` | такого аккаунта в цепи нет |
| `429` | лимит по аккаунту или по IP |
| `502` | `transfer` не прошёл |

Все переводы уходят одной транзакцией: аккаунт получает либо всё, либо ничего.

## Конфиг

Всё, кроме ключа, — в `config.js`, `networks.wiretest.faucet`: кто issuer, какая
политика ресурсов, кто funder, что и сколько наливать, лимиты. Ключ — в `.env`,
`WIRE_TESTNET_KEY`, это WIF админского ключа цепи. Он авторизует и `wireno`, и
`testtoken`, и `sysio` — у всех них один и тот же `PUB_K1_5uHsFXUR…`.

pm2: `Alcor-wire-faucet`, `env: { NETWORK: 'wiretest', PORT: 3100 }`, **один
инстанс** — сервис сериализует свои записи в цепь у себя в процессе, второй
инстанс гонялся бы с ним за nonce.

## Как это устроено

**Регистрация — две транзакции, а не одна.** Имя аккаунта генерится *внутри*
`newuser` уже на исполнении, поэтому на момент упаковки транзакции оно неизвестно,
а `addpolicy` требует его параметром. Поэтому `newuser` → узнать имя → `addpolicy`.

Имя узнаётся через `get_accounts_by_authorizers` по тому же ключу, а не из таблицы
`sponsors`: nodeop парсит `lower_bound` как JSON, и на этой сборке имя туда не
передать ни строкой (`Unexpected char`), ни числом, ни через `key_type: name`.

Задеплоенный `sysio.roa` выдаёт имена вида `wireno.<suffix>` — это расходится с
исходниками в `wire-system-contracts` (там 12 символов из sha256), сверяться надо
с живым ABI.

`nonce` — 12 случайных символов из алфавита `name`, обязан быть уникален в рамках
issuer'а (повтор упадёт с `Sponsor entry for this nonce already exists`).

**Лимиты — скользящее окно в Redis** (sorted set, скор = таймстамп), не календарные
сутки: иначе в полночь открывается окно на двойную пачку. У IPv6 считается по `/64`,
иначе лимит обходится сменой последнего хекстета. Слот тратится только когда цепь
реально приняла работу: провалившийся `newuser` и уже привязанный ключ лимит не жрут.

**Транспорт до ноды — `services/chain/wire/transport.ts`**, тот же, которым ходит
апдейтер. Встроенный `fetch` там непригоден: нода слушает 6666, а это порт из
блоклиста WHATWG, и undici рубит запрос до коннекта.

**Подпись — `@wireio/sdk-core`, не `@wharfkit/antelope`**: у Wire шесть типов
ключей, и кошельки пользователей держат те два, которых у Antelope не было —
`PUB_ED_` (Solana) и `PUB_EM_` (MetaMask).

## nginx

Оба файла лежат в [nginx/](nginx/) и совпадают байт в байт с задеплоенными:

| В репо | На сервере |
|---|---|
| `nginx/wire-testnet.conf` | `/etc/nginx/snippets/wire-testnet.conf` |
| `nginx/wire-test-realip.conf` | `/etc/nginx/conf.d/wire-test-realip.conf` |

Снипет подключён одной строкой `include` внутри server-блока `.alcor.exchange`.
Бэкап исходного конфига — `/root/alcor.exchange.bak.*`.

`^~` в локации обязателен — иначе запрос перехватит regex `~ ^/api/v[23]/` на ex44
и уведёт на `$api_upstream`.

Путь трафика: клиент → Cloudflare → LB `65.109.128.4` → ex44 → сервис. **Основной
домен `alcor.exchange` до ex44 не доходит вообще** — у него в Cloudflare другой
origin (фронт на Nuxt), все пути под `/api/*` там ловят 301 на `wax.`. Вынести
сервис на `wire.alcor.exchange` можно только проксируемой A-записью на
`65.109.128.4` в панели Cloudflare: `server_name` с ведущей точкой (`.alcor.exchange`)
и на LB, и на ex44 матчит любой сабдомен — так и работает `wax.`.

Определение IP клиента — `/etc/nginx/conf.d/wire-test-realip.conf`. В `nginx.conf`
есть `set_real_ip_from 65.109.128.4` без `real_ip_recursive`, поэтому `$remote_addr`
берётся из последнего элемента X-Forwarded-For — а его дописывает LB, и это адрес
Cloudflare, не клиента. Настоящий IP лежит в `CF-Connecting-IP`, и мы доверяем ему
только когда запрос физически пришёл с LB (`$realip_remote_addr`). nginx кладёт
результат в X-Forwarded-For **перезаписью**, а не `$proxy_add_x_forwarded_for`:
иначе клиент прислал бы свой заголовок, nginx дописал бы реальный IP в конец, а
сервис читает первый элемент — и лимит обходится одним заголовком. Сам сервис
слушает только loopback, поэтому мимо nginx этот заголовок не подделать.

## Бюджет

Резерв `wireno` — около 3020 SYS ≈ 3.1 ГБ RAM, это потолок на всех юзеров. При
`ram: '0.5000 SYS'` (~520 KB) хватает примерно на 6000 аккаунтов.

Добавить ресурсы **существующему** аккаунту можно только через `expandpolicy` —
повторный `addpolicy` падает.

`testtoken` держит по 999 млн USDT и TEST, при 1000 на аккаунт это не кончится.
