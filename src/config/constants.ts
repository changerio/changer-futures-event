export enum CHAIN_IDS {
  hardhat = 31337, // hardhat test network
  zksyncEra = 324,
  zksyncEraGoerli = 280,
}

export enum SUBGRAPHS {
  hardhat = 'http://127.0.0.1:8000/subgraphs/name/changerio/gambit',
  zksyncEra = 'https://api.studio.thegraph.com/query/56479/gambit-zksync/v0.1.20-rc1',
  zksyncEraGoerli = 'https://api.studio.thegraph.com/proxy/47348/gambit-zksync-alpha/version/latest',//'http://3.35.234.124:8000/subgraphs/name/changerio/gambit',
}