import { extractHashFromURL } from '../../clients/ipfs';
import { Table } from '../../db/db';
import { missingMetadataIPFSHash } from '../../triggers/missing';
import { getMetadataURL } from '../../types/metadata';
import { NFT, NftFactory } from '../../types/nft';
import { Clients, Processor } from '../../types/processor';

const name = 'addMetadataIPFSHash';


export const getMetadataIPFSHash = (nft: NFT, erc721ContractsByAddress: { [key: string]: NftFactory }): (string | null | undefined) => {
  const address = nft.contractAddress;
  const contract = erc721ContractsByAddress[address];
  const contractTypeName = contract?.contractType;
  const metadataURL = getMetadataURL(nft, contractTypeName);
  if (!metadataURL) {
    return '';
  }
  const hash = extractHashFromURL(metadataURL);
  // Note: We return '' rather than null in the case that the hash is null as a hacky way to update the nft record
  // so that it tracks that the processor has run through it already. This allows us to distinguish between nfts that have
  // been processed with no ipfs result vs nfts that have not yet been processed.
  return hash !== null ? hash : '';
}

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
