import { BigNumber, ethers } from 'ethers';
import _ from 'lodash';

import { newERC721Transfers } from '../../triggers/newNFTContractEvent';
import { formatAddress } from '../../types/address';
import { ERC721NFT } from '../../types/erc721nft';
import { ERC721Contract, ETHEREUM_NULL_ADDRESS, NFTContractTypes } from '../../types/ethereum';
import { Clients, Processor } from '../../types/processor';
import { Cursor } from '../../types/trigger';

const NAME = 'createERC721NFTsFromTransfers';

const processorFunction = (contracts: ERC721Contract[]) =>
  async ({ newCursor, items }: {newCursor: Cursor, items: ethers.Event[]}, clients: Clients) => {
    const newNFTs = contracts.reduce((accum, contract) => {
      const contractTypeName = contract.contractType;
      const contractType = NFTContractTypes[contractTypeName];
      const newMints = items.filter(transfer => {
        return transfer.args!.from === ETHEREUM_NULL_ADDRESS;
      })
      const newContractNFTs:Partial<ERC721NFT>[] = newMints.map((mint) => {
        const tokenId = BigInt((mint.args!.tokenId as BigNumber).toString());
        return {
          id: contractType.buildNFTId(contract.address, tokenId),
          createdAtEthereumBlockNumber: '' + mint.blockNumber,
          contractAddress: formatAddress(contract.address),
          tokenId,
          platformId: contract.platform,
        };
      });
      return accum.concat(newContractNFTs);
    }, [] as Partial<ERC721NFT>[]);
    await clients.db.insert('erc721nfts', newNFTs);
    await clients.db.updateProcessor(NAME, newCursor);
  };

export const createERC721NFTsFromTransfersProcessor: (contracts: ERC721Contract[]) => Processor = (contracts: ERC721Contract[]) => {
  return {
    name: NAME,
    trigger: newERC721Transfers(contracts),
    processorFunction: processorFunction(contracts),
  }
};
