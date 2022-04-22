import { BigNumber, ethers } from 'ethers';
import _ from 'lodash';

import { newEditionsCreated } from '../../triggers/newNFTContractEvent';
import { formatAddress } from '../../types/address';
import { ERC721Contract, ETHEREUM_NULL_ADDRESS, NFTContractTypes } from '../../types/ethereum';
import { Metadata } from '../../types/metadata';
import { NFT } from '../../types/nft';
import { Clients, Processor } from '../../types/processor';
import { Cursor } from '../../types/trigger';

const NAME = 'createSoundMetadataIds';

const processorFunction = (contract: ERC721Contract, name: string) =>
  async ({ newCursor, items }: {newCursor: Cursor, items: ethers.Event[]}, clients: Clients) => {
    const newEditions = items.map((editionCreated:ethers.Event): Metadata => ({
      id: editionCreated.args!.editionId,
      platformId: MusicPlatform.sound,
    }));
    const mintsByBlock = _.groupBy(newMints, 'blockHash');
    const blockHashes = Object.keys(mintsByBlock);
    const timestamps = await clients.eth.getBlockTimestamps(blockHashes);
    blockHashes.forEach((hash, index) => {
      const timestamp = BigInt(timestamps[index]) * BigInt(1000);
      const mints = mintsByBlock[hash];
      mints.forEach(mint => (mint as ethers.Event & {timestamp:bigint}).timestamp = timestamp)
    })
    const newNFTs:NFT[] = newMints.map((mint) => {
      const tokenId = BigInt((mint.args!.tokenId as BigNumber).toString());
      return {
        id: contractType.buildNFTId(contract.address, tokenId),
        createdAtEthereumBlockNumber: '' + mint.blockNumber,
        createdAtTime: new Date(parseInt((mint as any).timestamp)),
        contractAddress: formatAddress(contract.address),
        tokenId,
        platformId: contract.platform,
        metadataId: contractType.buildNFTMetadataId(contract.address, tokenId)
      };
    });
    await clients.db.insert('nfts', newNFTs);
    await clients.db.updateProcessor(name, newCursor);
  };

export const createSoundMetadataIds: (contract: ERC721Contract) => Processor = (contract: ERC721Contract) => ({
  name: `${NAME}_${contract.address}`,
  trigger: newEditionsCreated(contract),
  processorFunction: processorFunction(contract, `${NAME}_${contract.address}`),
  initialCursor: contract.startingBlock,
});
