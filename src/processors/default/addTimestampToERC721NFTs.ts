import { BigNumber, ethers } from 'ethers';
import _ from 'lodash';

import { missingCreatedAtTime } from '../../triggers/missing';
import { newERC721Transfers } from '../../triggers/newNFTContractEvent';
import { formatAddress } from '../../types/address';
import { ERC721NFT } from '../../types/erc721nft';
import { ERC721Contract } from '../../types/ethereum';
import { Clients, Processor } from '../../types/processor';

const processorFunction = async ({ items }: {items: ERC721NFT}, clients: Clients) => {
    const nftsByBlockNumber = _.groupBy(items, 'createdAtEthereumBlockNumber');
    const blockNumbers = Object.keys(nftsByBlockNumber);
    const timestampsResponse = await clients.eth.getBlockTimestamps(blockNumbers);
    const timestampByBlockNumber = _.keyBy(timestampsResponse, 'number');
    console.log({ blockNumbers, timestampByBlockNumber });
    process.exit();
    // blockNumbers.forEach((blockNumber) => {
    //   const timestampMillis = BigInt(timestampByBlockNumber[blockNumber]) * BigInt(1000);
    //   const nfts:ERC721NFT[] = nftsByBlockNumber[blockNumber] as any;
    //   nfts.forEach(nft => nft.createdAtTime = new Date(parseInt(timestampMillis.toString())))
    // })
    // await clients.db.update('erc721nfts', newNFTs);
  };

export const addTimestampToERC721NFTs: (contract: ERC721Contract) => Processor = (contract: ERC721Contract) => ({
  trigger: missingCreatedAtTime,
  processorFunction: processorFunction,
});
