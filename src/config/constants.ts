export enum CHAIN_IDS {
  hardhat = 31337, // hardhat test network
  zksyncEra = 324,
  zksyncEraGoerli = 280,
  arbitrum = 42161,
  arbitrumGoerli = 421613,
}

export enum SUBGRAPHS {
  hardhat = 'http://127.0.0.1:8000/subgraphs/name/changerio/gambit',

  zksyncEraGoerli = 'https://api.studio.thegraph.com/query/56479/gambit-zksync-testnet/version/latest',
  // 'https://api.studio.thegraph.com/proxy/47348/gambit-zksync-alpha/version/latest',
  arbitrumGoerli = 'https://api.studio.thegraph.com/query/56479/gambit-arbitrum-goerli/version/latest',

  zksyncEra = 'https://service.gambit.trade/subgraphs/name/changerio/gambit',
  // 'https://api.studio.thegraph.com/query/56479/gambit-zksync/version/latest'
  arbitrum = 'https://subgraph.satsuma-prod.com/{QUERY_KEY}/s-team--2985234/gambit-arbitrum/api'
  // 'https://subgraph.satsuma-prod.com/s-team--2985234/gambit-arbitrum/playground'
  // 'https://api.studio.thegraph.com/query/56479/gambit-arbitrum/version/latest' free
}

export enum PYTH {
  mainnet = 'https://hermes.pyth.network/api', //'https://xc-mainnet.pyth.network/api',
  testnet = 'https://hermes-beta.pyth.network/api',
}

export const ALL_NETWORK_STR = 'all';
export const ARBITRUM_NETWORK_STR = 'arbitrum';
export const ZKSYNCERA_NETWORK_STR = 'zksyncera';