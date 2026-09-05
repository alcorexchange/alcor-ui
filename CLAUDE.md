# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development - run with specific chain (wax, eos, telos, proton)
NETWORK=wax DISABLE_DB=true yarn dev

# Production build
NETWORK=wax yarn build
yarn start

# Code quality
yarn lint                    # ESLint
yarn format                  # Prettier

# Bundle analysis
yarn analyze
```

## Architecture

Alcor is a multi-chain DEX built with **Nuxt 2.x** (Vue 2 + Vuex).

### Multi-Chain Configuration
All chain-specific settings are in `config.js`. Each network (eos, wax, telos, proton) has:
- Contract addresses (main dex, AMM, OTC, staking, NFT market)
- RPC endpoints and Hyperion/Light API URLs
- SCAM_CONTRACTS / SCAM_TOKENS arrays for blocking
- RECOMMENDED_MARKETS, PINNED_MARKETS, GLOBAL_TOKENS

### Key Directories
- **pages/** - Nuxt file-based routing (swap, markets, pools, farm, staking, nft-market, bridge, otc)
- **store/** - Vuex modules: `index.js` (root), `market.js`, `wallet.js`, `chain.js`, `amm/`, `farms.js`, `api.js`
- **plugins/** - Nuxt plugins including wallet integrations in `plugins/wallets/`
- **assets/fundamentals/** - Token metadata JSONs per chain (wax.json, eos.json, telos.json, proton.json)
- **lib/utils/** - Helper functions (amm.js, pools.js, eosjs.js, etc.)
- **locales/** - i18n translations (en, ru, cn, ua, ph, it)

### Token ID Format
Tokens are identified as `symbol-contract`, e.g., `usdt-tethertether`, `wax-eosio.token`.

### Wallet Integration
Wallet providers are abstracted in `plugins/wallets/`. Supported: Scatter, Proton, Anchor, WAX Cloud Wallet.

## Token Management

See parent `/CLAUDE.md` for:
- Adding token info to fundamentals JSON files
- Banning scam tokens via SCAM_CONTRACTS/SCAM_TOKENS in config.js
