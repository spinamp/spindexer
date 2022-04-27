import { gql, GraphQLClient } from 'graphql-request';

const blocksAPI = new GraphQLClient(process.env.BLOCKS_SUBGRAPH_ENDPOINT!);

export type BlocksClient = {
  fetchBlockTimestamps: (blockNumbers: string[]) => Promise<{number:string, timestamp:string}[]>;
}

const init = async () => {
  return {
    fetchBlockTimestamps: async (
      blockNumbers: string[],
    ): Promise<any[]> => {
      const blockNumbersForQuery = JSON.stringify(blockNumbers);
      const { blocks } = await blocksAPI.request(
        gql`
          {
            blocks(first:${blockNumbers.length}, where: {number_in: ${blockNumbersForQuery}}) {
              number
              timestamp
            }
          }
        `,
      );
      return blocks;
    }
  }
}

export default {
  init
};
