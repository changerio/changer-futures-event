export enum CHAIN_IDS {
  hardhat = 31337, // hardhat test network
  zksyncEra = 324,
  zksyncEraGoerli = 280,
}

export enum SUBGRAPHS {
  hardhat = 'http://127.0.0.1:8000/subgraphs/name/changerio/gambit',

  zksyncEraGoerli = 'https://api.studio.thegraph.com/proxy/47348/gambit-zksync-alpha/version/latest',
  arbitrumGoerli = 'https://api.studio.thegraph.com/query/56479/gambit-arbitrum-goerli/version/latest',

  zksyncEra = 'https://api.studio.thegraph.com/query/56479/gambit-zksync/version/latest', // 'https://service.gambit.trade/subgraphs/name/changerio/gambit', 
  arbitrum = 'https://api.studio.thegraph.com/query/56479/gambit-arbitrum/version/latest'
}