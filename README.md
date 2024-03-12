# changer-futures-event

## structure

```
app
├── node_modules
├── src
     ├── config      # Config
     ├── cache       # Local cache
     ├── routes      # Api Endpoints
     ├── services    # Business
     ├── worker      # Cron job
     ├── app.ts
     └── swagger.ts
├── test
     └── depend on src
├── .gitignore
├── .env
├── package.json
└── README.md

```

## start

```
git clone https://github.com/changerio/changer-futures-event.git
```

### make .env

- example

```
NETWORK_NAME=zksyncEraGoerli
DUNE_API_KEY=
```

## Running

### Start

```
# install
yarn install

# local start
yarn local

# api docs
Go http://localhost:3000/api-docs
```

### dev

```
# install dependencies
yarn install

# run in local mode on port 3000
yarn local

# generate production build
npm run build

# run
yarn start
```
