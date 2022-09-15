import { BigNumber, ethers } from 'ethers';
import _ from 'lodash';

import { Table } from '../../db/db';
import { newERC721Transfers } from '../../triggers/newNFTContractEvent';
import { formatAddress } from '../../types/address';
import { newMint } from '../../types/ethereum';
import { NFT, ERC721Transfer, NftFactory, NFTStandard } from '../../types/nft';
import { NFTFactoryTypes } from '../../types/nftFactory';
import { Clients, Processor } from '../../types/processor';
import { Cursor } from '../../types/trigger';

const NAME = 'createERC721NFTsFromTransfers';

const CHAIN = 'ethereum';

const processorFunction = (contracts: NftFactory[]) =>
  async ({ newCursor, items }: { newCursor: Cursor, items: ethers.Event[] }, clients: Clients) => {
    const contractsByAddress = _.keyBy(contracts, 'id');
    const newNFTs: Partial<NFT>[] = [];
    const updates: Partial<NFT>[] = [];
    const transfers: Partial<ERC721Transfer>[] = [];

    items.forEach((item): Partial<NFT> | undefined => {
      const address = item.address;
      const contract = contractsByAddress[address];
      const contractTypeName = contract.contractType;
      const contractType = NFTFactoryTypes[contractTypeName];

      if (!contractType?.buildNFTId){
        throw 'buildNFTId not specified'
      }

      const contractAddress = formatAddress(contract.id);
      const fromAddress = formatAddress(item.args!.from);
      const toAddress = formatAddress(item.args!.to);
      const tokenId = BigInt((item.args!.tokenId as BigNumber).toString());
      const nftId = contractType.buildNFTId(contractAddress, tokenId);

      transfers.push({
        id: `${CHAIN}/${item.blockNumber}/${item.logIndex}`,
        contractAddress: contractAddress,
        from: fromAddress,
        to: toAddress,
        tokenId,
        createdAtEthereumBlockNumber: '' + item.blockNumber,
        nftId: nftId,
        transactionHash: item.transactionHash
      });

      if (!newMint(fromAddress)) {
        updates.push({
          id: nftId,
          owner: toAddress
        })
        return undefined;
      }
      newNFTs.push({
        id: nftId,
        createdAtEthereumBlockNumber: '' + item.blockNumber,
        contractAddress: contractAddress,
        tokenId,
        platformId: contract.platformId,
        owner: toAddress,
        approved: contract.autoApprove
      });
    });

    await clients.db.insert(Table.nfts, newNFTs.filter(n => !!n), { ignoreConflict: 'id' });
    await clients.db.update(Table.nfts, updates);

    const transferNftIds = transfers.map(transfer => transfer.nftId);
    const existingNfts = new Set((await clients.db.getRecords<NFT>(Table.nfts, [ ['whereIn', [ 'id', transferNftIds ]] ])).map(nft => nft.id));
    const transfersForExistingNfts = transfers.filter(transfer => existingNfts.has(transfer.nftId!));

    await clients.db.insert(Table.erc721Transfers, transfersForExistingNfts);
    await clients.db.updateProcessor(NAME, newCursor);
  };

export const createERC721NFTsFromTransfersProcessor: (contracts: NftFactory[]) => Processor = (contracts: NftFactory[]) => {
  return {
    name: NAME,
    trigger: newERC721Transfers(
      contracts
        .filter(c => c.standard === NFTStandard.ERC721 && c.approved === true) //only include approved ERC721 contracts
        .map(c => ({ id: c.id, startingBlock: c.startingBlock! })), // map contracts to EthereumContract
      process.env.ETHEREUM_BLOCK_QUERY_GAP!
    ),
    processorFunction: processorFunction(contracts),
  }
};
