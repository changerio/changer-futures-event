# changer-futures-monkey

## structure

```
app
├── node_modules
├── src
     ├── blockchain  # BlockChain Request 
     ├── config      # Config
     ├── routes      # Api Endpoints
     ├── services    # Business
     ├── app.ts
     └── swagger.ts
├── test
     └── depend on src
├── .gitignore
├── package.json
└── README.md

```

## start

```
git clone https://github.com/changerio/changer-futures-monkey.git
```

### make .env
- example
```
NETWORK_NAME=zksyncEraGoerli
WS_URL=https://testnet.era.zksync.dev/ws
PYTH_NETWORK_PRICE_SERVICE_URL=https://xc-testnet.pyth.network

SIGNER_MNEMONIC=...
GOV_MNEMONIC=...
```

## Running

### Monkey Start

```
# install
yarn install
# start
yarn local
# api docs
Go http://localhost:3000/api-docs
# local setup (transfer & mint)
Excute http://localhost:3000/api-docs/#/Monkey/get_monkey_setup_
# monkey live
Excute http://localhost:3000/api-docs/#/Monkey/post_monkey_live_ (true)
# show log
Excute http://localhost:3000/api-docs/#/Monkey/get_monkey_log_ 
```

### dev

```
# install dependencies
yarn install

# run in local mode on port 3000
yarn local

# generate production build
npm run build

# run generated content in dist folder on port 3000 (local)
npm run lstart

# run generated content in dist folder on port 3000 (testnet)
npm run tstart
```

### docker

```
# make docker image with tag
docker build . -t changerio/changer-futures-monkey --build-arg token=$GITHUB_AUTH_TOKEN

# make docker image with tag (no cache)
docker build --no-cache . -t changerio/changer-futures-monkey --build-arg token=$GITHUB_AUTH_TOKEN

# image list
docker images

# docker run
docker run -p 8080:3000 -d changerio/changer-futures-monkey
```

## Testing


### Jest with supertest

```
npm run test
```
