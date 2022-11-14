import { BigNumber, ethers } from 'ethers';
import _ from 'lodash';

import { Table } from '../../db/db';
import { newERC721Transfers } from '../../triggers/newNFTContractEvent';
import { formatAddress } from '../../types/address';
import { ChainId } from '../../types/chain';
import { burned, newMint } from '../../types/evm';
import { NFT, ERC721Transfer, NftFactory, NFTStandard } from '../../types/nft';
import { NFTFactoryTypes } from '../../types/nftFactory';
import { consolidate, Collector, NFTsCollectors, NFTsCollectorsChanges } from '../../types/nftsCollectors';
import { Clients, Processor } from '../../types/processor';
import { Cursor } from '../../types/trigger';
import { transferId } from '../../utils/identifiers';

const NAME = 'createERC721NFTsFromTransfers';

const processorFunction = (chainId: ChainId, contracts: NftFactory[], name: string) =>
  async ({ newCursor, items }: { newCursor: Cursor, items: ethers.Event[] }, clients: Clients) => {
    const contractsByAddress = _.keyBy(contracts, 'address');
    const newNFTs: Partial<NFT>[] = [];
    const updatedNFTs: Partial<NFT>[] = [];
    const transfers: Partial<ERC721Transfer>[] = [];
    const nftsCollectorsChanges: NFTsCollectorsChanges[] = [];

    items.forEach((item): void => {
      const address = item.address;
      const contract = contractsByAddress[address];
      const contractTypeName = contract.contractType;
      const contractType = NFTFactoryTypes[contractTypeName];

      if (!contractType?.buildNFTId){
        throw 'buildNFTId not specified'
      }

      const toAddress = formatAddress(item.args!.to);
      const fromAddress = formatAddress(item.args!.from);
      const contractAddress = formatAddress(contract.address);
      const tokenId = BigInt((item.args!.tokenId as BigNumber).toString());
      const nftId = contractType.buildNFTId(chainId, contractAddress, tokenId);

      transfers.push({
        id: transferId(chainId, item.blockNumber, item.logIndex),
        contractAddress: contractAddress,
        from: fromAddress,
        to: toAddress,
        tokenId,
        createdAtBlockNumber: '' + item.blockNumber,
        nftId: nftId,
        transactionHash: item.transactionHash,
        chainId: chainId
      });

      if (!newMint(fromAddress)) {
        updatedNFTs.push({
          id: nftId,
          owner: toAddress,
          burned: burned(toAddress)
        })
        nftsCollectorsChanges.push({ nftId: nftId, collectorId: fromAddress, amount: -1 })
        if (!burned(toAddress)) {
          nftsCollectorsChanges.push({ nftId: nftId, collectorId: toAddress, amount: 1 })
        }
      } else {
        newNFTs.push({
          id: nftId,
          createdAtBlockNumber: '' + item.blockNumber,
          contractAddress: contractAddress,
          nftFactoryId: contract.id,
          tokenId,
          platformId: contract.platformId,
          owner: toAddress,
          approved: contract.autoApprove,
          publicReleaseTime: contract.typeMetadata?.other?.publicReleaseTime || undefined,
          chainId,
        });
        nftsCollectorsChanges.push({ nftId: nftId, collectorId: toAddress, amount: 1 })
      }
    });

    const allCollectors = nftsCollectorsChanges.map<Collector>(({ collectorId }) => { return { id: collectorId } } );
    const idPairs = _.uniq(nftsCollectorsChanges.map( (e) => [e.nftId, e.collectorId] ))
    const idPairChunks = _.chunk(idPairs, 500);
    const existingNftsCollectors: NFTsCollectors[] = [];
    for (let i = 0; i < idPairChunks.length; i++) {
      const records = await clients.db.getRecords<NFTsCollectors>(Table.nftsCollectors,
        [ ['whereIn', [ ['nftId', 'collectorId'], idPairChunks[i] ] ] ]
      );
      existingNftsCollectors.push(...records);
    }

    const allNftsCollectorsChanges = nftsCollectorsChanges.concat(existingNftsCollectors)
    const updatedNftsCollectors = consolidate(allNftsCollectorsChanges)
    const updatedNftsCollectorsChunks = _.chunk(updatedNftsCollectors, 500);

    await clients.db.insert(Table.nfts, newNFTs.filter(n => !!n), { ignoreConflict: 'id' });
    await clients.db.update(Table.nfts, updatedNFTs);
    await clients.db.upsert(Table.collectors, _.uniqBy(allCollectors, 'id'))
    for (let i = 0; i < updatedNftsCollectorsChunks.length; i++) {
      await clients.db.upsert(Table.nftsCollectors, updatedNftsCollectorsChunks[i], ['nftId', 'collectorId']);
    }

    const transferNftIds = transfers.map(transfer => transfer.nftId);
    const existingNfts = new Set((await clients.db.getRecords<NFT>(Table.nfts, [ ['whereIn', [ 'id', transferNftIds ]] ])).map(nft => nft.id));
    const transfersForExistingNfts = transfers.filter(transfer => existingNfts.has(transfer.nftId!));

    await clients.db.insert(Table.erc721Transfers, transfersForExistingNfts);
    await clients.db.updateProcessor(name, newCursor);
  };
  
export const createERC721NFTsFromTransfersProcessor: (chainId: ChainId, contracts: NftFactory[]) => Processor = 
  (chainId, contracts) => {
    const cursorName = chainId === ChainId.ethereum ? NAME : `${NAME}_${chainId}`;

    return {
      name: cursorName,
      trigger: 
    newERC721Transfers(
      chainId,
      contracts
        .filter(c => c.standard === NFTStandard.ERC721 && c.approved === true) //only include approved ERC721 contracts
        .map(c => ({ id: c.id, startingBlock: c.startingBlock!, address: c.address })), // map contracts to EthereumContract
      process.env.ETHEREUM_BLOCK_QUERY_GAP!
    ),
      processorFunction: processorFunction(chainId, contracts, cursorName),
    }
  };
