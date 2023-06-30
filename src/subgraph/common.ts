import { GraphQLClient, gql } from 'graphql-request';
import config from "../config/default";

const client = new GraphQLClient(config.subgraph.gambit);

export async function execute(query: string, variables) {
    let ret = { "status": 500 }
    try {
        ret = await client.request(query, variables);
    } catch (error) {
        console.log(error);
    }
    return JSON.parse(JSON.stringify(ret));
}
