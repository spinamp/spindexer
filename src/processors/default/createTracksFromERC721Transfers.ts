import { BigNumber, ethers } from 'ethers';
import _ from 'lodash';

import { newERC721Transfers } from '../../triggers/newNFTContractEvent';
import { formatAddress } from '../../types/address';
import { buildERC721Id, ERC721Contract, ETHEREUM_NULL_ADDRESS } from '../../types/ethereum';
import { NFT } from '../../types/nft';
import { Clients, Processor } from '../../types/processor';
import { Cursor } from '../../types/trigger';

import { createTracksFromNFTs } from './createTracksFromNFTs';

const NAME = 'createTracksFromERC721Transfers';

const processorFunction = (contract: ERC721Contract, name: string) =>
  async ({newCursor, items}: {newCursor: Cursor, items: ethers.Event[]}, clients: Clients) => {
    const newMints = items.filter(transfer => {
      return transfer.args!.from === ETHEREUM_NULL_ADDRESS;
    })
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
        id: buildERC721Id(contract.address, tokenId),
        createdAtEthereumBlockNumber: '' + mint.blockNumber,
        createdAtTime: new Date(parseInt((mint as any).timestamp)),
        contractAddress: formatAddress(contract.address),
        tokenId,
        platformId: contract.platform,
        trackId: contract.buildTrackId(contract.address, tokenId)
      };
    });
    const newTracks = await createTracksFromNFTs(newNFTs, clients.db, clients.eth);
    const unburnedTracks = newTracks.filter(t=>t.tokenURI);
    const unburnedTracksById = _.keyBy(unburnedTracks, 'id');
    const unburnedNFTs = newNFTs.filter(nft => unburnedTracksById[nft.trackId]);
    await clients.db.insert('tracks', unburnedTracks);
    await clients.db.insert('nfts', unburnedNFTs);
    await clients.db.updateProcessor(name, newCursor);
  };

export const createTracksFromERC721TransfersProcessor: (contract: ERC721Contract) => Processor = (contract: ERC721Contract) => ({
  name: `${NAME}_${contract.address}`,
  trigger: newERC721Transfers(contract),
  processorFunction: processorFunction(contract, `${NAME}_${contract.address}`),
  initialCursor: contract.startingBlock,
});
