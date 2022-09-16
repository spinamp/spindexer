import { BigNumber, ethers } from 'ethers';
import _ from 'lodash';

import { Table } from '../../db/db';
import { newERC721Transfers } from '../../triggers/newNFTContractEvent';
import { formatAddress } from '../../types/address';
import { newMint } from '../../types/ethereum';
import { NFT, ERC721Transfer, NftFactory, NFTStandard } from '../../types/nft';
import { NFTFactoryTypes } from '../../types/nftFactory';
import { consolidate, Collector, NFTsCollectors } from '../../types/nftsCollectors';
import { Clients, Processor } from '../../types/processor';
import { Cursor } from '../../types/trigger';
import { ethereumTransferId } from '../../utils/identifiers';

const NAME = 'createERC721NFTsFromTransfers';

const processorFunction = (contracts: NftFactory[]) =>
  async ({ newCursor, items }: { newCursor: Cursor, items: ethers.Event[] }, clients: Clients) => {
    const contractsByAddress = _.keyBy(contracts, 'id');
    const newNFTs: Partial<NFT>[] = [];
    const updatedNFTs: Partial<NFT>[] = [];
    const transfers: Partial<ERC721Transfer>[] = [];
    const updatedNftsCollectors: NFTsCollectors[] = [];

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
        id: ethereumTransferId(item.blockNumber, item.logIndex),
        contractAddress: contractAddress,
        from: fromAddress,
        to: toAddress,
        tokenId,
        createdAtEthereumBlockNumber: '' + item.blockNumber,
        nftId: nftId,
        transactionHash: item.transactionHash
      });

      if (!newMint(fromAddress)) {
        updatedNFTs.push({
          id: nftId,
          owner: toAddress
        })
        updatedNftsCollectors.push({ nftId: nftId, collectorId: fromAddress, amount: -1 })
        updatedNftsCollectors.push({ nftId: nftId, collectorId: toAddress, amount: 1 })
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
      updatedNftsCollectors.push({ nftId: nftId, collectorId: toAddress, amount: 1 })
    });

    // update Collectors table
    const allCollectors = updatedNftsCollectors.map<Collector>(({ collectorId }) => { return { id: collectorId } } );
    await clients.db.insert(Table.collectors, _.uniqBy(allCollectors, 'id'), { ignoreConflict: 'id' })

    // fetch any existing NftCollectors
    const idPairs = _.uniq(updatedNftsCollectors.map( (e) => [e.nftId, e.collectorId] ))
    const existingNftsCollectors = await clients.db.getRecords<NFTsCollectors>(Table.nftsCollectors,
      [ ['whereIn', [ ['nftId', 'collectorId'], idPairs ] ] ]
    );

    // update all NFTsCollectors with most up to date amounts
    const fullNftsCollectors = updatedNftsCollectors.concat(existingNftsCollectors)
    const consolidatedNftsCollectors = consolidate(fullNftsCollectors)
    await clients.db.insert(Table.nftsCollectors, consolidatedNftsCollectors, { ignoreConflict: ['nftId', 'collectorId'] });

    // update NFTs table
    await clients.db.insert(Table.nfts, newNFTs.filter(n => !!n), { ignoreConflict: 'id' });
    await clients.db.update(Table.nfts, updatedNFTs);

    const transferNftIds = transfers.map(transfer => transfer.nftId);
    const existingNfts = new Set((await clients.db.getRecords<NFT>(Table.nfts, [ ['whereIn', [ 'id', transferNftIds ]] ])).map(nft => nft.id));
    const transfersForExistingNfts = transfers.filter(transfer => existingNfts.has(transfer.nftId!));

    // update ERC721Transfers table
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
