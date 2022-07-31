import { Table } from '../../db/db';
import { missingMetadataIPFSHash } from '../../triggers/missing';
import { getMetadataIPFSHash } from '../../types/metadata';
import { NFT, NftFactory } from '../../types/nft';
import { Clients, Processor } from '../../types/processor';

const name = 'addMetadataIPFSHash';

const processorFunction = (erc721ContractsByAddress: { [key: string]: NftFactory }) => async (nfts: NFT[], clients: Clients) => {
  console.log(`Processing updates for ${nfts.map(n => n.id)}`)
  const nftUpdates = nfts.map(n => ({
    id: n.id,
    metadataIPFSHash: getMetadataIPFSHash(n, erc721ContractsByAddress)
  }))
  await clients.db.update(Table.nfts, nftUpdates);
};

export const addMetadataIPFSHashProcessor: (erc721ContractsByAddress: { [key: string]: NftFactory }) => Processor =
(erc721ContractsByAddress: { [key: string]: NftFactory }) => ({
  name,
  trigger: missingMetadataIPFSHash,
  processorFunction: processorFunction(erc721ContractsByAddress),
  initialCursor: undefined
});
