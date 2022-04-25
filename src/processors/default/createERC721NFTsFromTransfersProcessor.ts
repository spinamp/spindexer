import { BigNumber, ethers } from 'ethers';
import _ from 'lodash';

import { newERC721Transfers } from '../../triggers/newNFTContractEvent';
import { formatAddress } from '../../types/address';
import { ERC721NFT } from '../../types/erc721nft';
import { ERC721Contract, ETHEREUM_NULL_ADDRESS, NFTContractTypes } from '../../types/ethereum';
import { Clients, Processor } from '../../types/processor';
import { Cursor } from '../../types/trigger';

const NAME = 'createERC721NFTsFromTransfers';

const processorFunction = (contract: ERC721Contract, name: string) =>
  async ({ newCursor, items }: {newCursor: Cursor, items: ethers.Event[]}, clients: Clients) => {
    const contractTypeName = contract.contractType;
    const contractType = NFTContractTypes[contractTypeName];
    const newMints = items.filter(transfer => {
      return transfer.args!.from === ETHEREUM_NULL_ADDRESS;
    })
    const newNFTs:Partial<ERC721NFT>[] = newMints.map((mint) => {
      const tokenId = BigInt((mint.args!.tokenId as BigNumber).toString());
      return {
        id: contractType.buildNFTId(contract.address, tokenId),
        createdAtEthereumBlockNumber: '' + mint.blockNumber,
        contractAddress: formatAddress(contract.address),
        tokenId,
        platformId: contract.platform,
      };
    });
    await clients.db.insert('erc721nfts', newNFTs);
    await clients.db.updateProcessor(name, newCursor);
  };

export const createERC721NFTsFromTransfersProcessor: (contract: ERC721Contract) => Processor = (contract: ERC721Contract) => ({
  name: `${NAME}_${contract.address}`,
  trigger: newERC721Transfers(contract),
  processorFunction: processorFunction(contract, `${NAME}_${contract.address}`),
  initialCursor: JSON.stringify({ block: contract.startingBlock }),
});
