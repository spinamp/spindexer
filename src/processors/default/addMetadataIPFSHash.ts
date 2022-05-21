import { Table } from '../../db/db';
import { missingMetadataIPFSHash } from '../../triggers/missing';
import { ERC721NFT } from '../../types/erc721nft';
import { ERC721Contract } from '../../types/ethereum';
import { getMetadataIPFSHash } from '../../types/metadata';
import { Clients, Processor } from '../../types/processor';

const name = 'addMetadataIPFSHash';

const processorFunction = (erc721ContractsByAddress: { [key: string]: ERC721Contract }) =>  async (nfts: ERC721NFT[], clients: Clients) => {
  console.log(`Processing updates for ${nfts.map(n => n.id)}`)
  const nftUpdates = nfts.map(n => ({
    id: n.id,
    metadataIPFSHash: getMetadataIPFSHash(n, erc721ContractsByAddress)
  }))
  await clients.db.update(Table.erc721nfts, nftUpdates);
};

export const addMetadataIPFSHashProcessor: (erc721ContractsByAddress: { [key: string]: ERC721Contract }) => Processor =
(erc721ContractsByAddress: { [key: string]: ERC721Contract }) => ({
  name,
  trigger: missingMetadataIPFSHash,
  processorFunction: processorFunction(erc721ContractsByAddress),
  initialCursor: undefined
});
