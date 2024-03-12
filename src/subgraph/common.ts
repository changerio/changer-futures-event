import { GraphQLClient, gql } from "graphql-request";
import config from "../config/default";

export class GraphQLCommon {
  protected client: GraphQLClient;

  constructor(url: string = config.subgraph.gambit) {
    this.client = new GraphQLClient(url);
  }

  protected async execute(query: string, variables) {
    let ret = { status: 500 };
    try {
      ret = await this.client.request(query, variables);
    } catch (error) {
      console.log(error);
    }
    return JSON.parse(JSON.stringify(ret));
  }
}
