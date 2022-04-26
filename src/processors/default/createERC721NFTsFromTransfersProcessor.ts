import { BigNumber, ethers } from 'ethers';
import _ from 'lodash';

import { Table } from '../../db/db';
import { newERC721Transfers } from '../../triggers/newNFTContractEvent';
import { formatAddress } from '../../types/address';
import { ERC721NFT } from '../../types/erc721nft';
import { ERC721Contract, ETHEREUM_NULL_ADDRESS, NFTContractTypes } from '../../types/ethereum';
import { Clients, Processor } from '../../types/processor';
import { Cursor } from '../../types/trigger';

const NAME = 'createERC721NFTsFromTransfers';

const processorFunction = (contracts: ERC721Contract[]) =>
  async ({ newCursor, items }: {newCursor: Cursor, items: ethers.Event[]}, clients: Clients) => {
    const contractsByAddress = _.keyBy(contracts, 'address');
    const newNFTs = items.map((item):Partial<ERC721NFT> | undefined => {
      const address = item.address;
      const contract = contractsByAddress[address];
      const contractTypeName = contract.contractType;
      const contractType = NFTContractTypes[contractTypeName];
      const newMint = item.args!.from === ETHEREUM_NULL_ADDRESS
      if(!newMint) {
        return undefined;
      }
      const tokenId = BigInt((item.args!.tokenId as BigNumber).toString());
      return {
        id: contractType.buildNFTId(contract.address, tokenId),
        createdAtEthereumBlockNumber: '' + item.blockNumber,
        contractAddress: formatAddress(contract.address),
        tokenId,
        platformId: contract.platform,
      };
    });
    await clients.db.insert(Table.erc721nfts, newNFTs.filter(n=>!!n));
    await clients.db.updateProcessor(NAME, newCursor);
  };

export const createERC721NFTsFromTransfersProcessor: (contracts: ERC721Contract[]) => Processor = (contracts: ERC721Contract[]) => {
  return {
    name: NAME,
    trigger: newERC721Transfers(contracts),
    processorFunction: processorFunction(contracts),
  }
};
