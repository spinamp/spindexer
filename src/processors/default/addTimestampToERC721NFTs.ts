import _ from 'lodash';

import { Table } from '../../db/db';
import { missingCreatedAtTime } from '../../triggers/missing';
import { ERC721NFT } from '../../types/erc721nft';
import { Clients } from '../../types/processor';

const processorFunction = async (items: ERC721NFT, clients: Clients) => {
    const nftsByBlockNumber = _.groupBy(items, 'createdAtEthereumBlockNumber');
    const blockNumbers = Object.keys(nftsByBlockNumber);
    const timestampsResponse = await clients.blocks.fetchBlockTimestamps(blockNumbers);
    const responseByBlockNumber = _.keyBy(timestampsResponse, 'number');
    const nftUpdates:Partial<ERC721NFT>[] = [];
    blockNumbers.forEach((blockNumber) => {
      const timestampMillis = BigInt(responseByBlockNumber[blockNumber].timestamp) * BigInt(1000);
      const nfts:ERC721NFT[] = nftsByBlockNumber[blockNumber] as any;
      nfts.forEach(nft => nftUpdates.push({
        id: nft.id,
        createdAtTime: new Date(parseInt(timestampMillis.toString())),
      }));
    })
    await clients.db.update(Table.erc721nfts, nftUpdates);
  };

export const addTimestampToERC721NFTs = {
  name: 'addTimestampToERC721NFTs',
  trigger: missingCreatedAtTime,
  processorFunction: processorFunction,
};
