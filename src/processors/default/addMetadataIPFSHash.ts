import { Table } from '../../db/db';
import { missingMetadataIPFSHash } from '../../triggers/missing';
import { ERC721NFT } from '../../types/erc721nft';
import { getMetadataIPFSHash } from '../../types/metadata';
import { Clients, Processor } from '../../types/processor';

const name = 'addMetadataIPFSHash';

const processorFunction = async (nfts: ERC721NFT[], clients: Clients) => {
  console.log(`Processing updates for ${nfts.map(n=>n.id)}`)
  const nftUpdates = nfts.map(n => ({
    id: n.id,
    metadataIPFSHash: getMetadataIPFSHash(n)
  }))
  await clients.db.update(Table.erc721nfts, nftUpdates);
};

export const addMetadataIPFSHashProcessor: Processor = {
  name,
  trigger: missingMetadataIPFSHash,
  processorFunction,
  initialCursor: undefined
};
