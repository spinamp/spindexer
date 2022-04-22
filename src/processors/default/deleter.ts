import { ignoredNFTs } from '../../triggers/ignored';
import { nonAudioMetadata } from '../../triggers/nonAudio';
import { Metadata } from '../../types/metadata';
import { Clients, Processor } from '../../types/processor';
import { Record } from '../../types/record';

const deleteMetadatas = async (metadatas: Metadata[], clients: Clients) => {
  console.log(`Processing deletes for metadatas with types: ${metadatas.map(m => m.mimeType)}`);
  const metadataIdsForDelete = metadatas.map((m: Metadata) => m.id);
  await clients.db.delete('nfts', metadataIdsForDelete, 'metadataId');
  await clients.db.delete('metadatas', metadataIdsForDelete);
  console.log('Deleted');
};

const deleteRecords = (tableName:string, processorName:string) => async (ids: string[], clients: Clients) => {
  console.log(`Processing deletes for records with ids: ${ids}`);
  await clients.db.delete(tableName, ids);
  await clients.db.updateProcessor(processorName, 'true');
  console.log('Deleted');
};

export const stripNonAudio: Processor = {
  name: 'stripNonAudio',
  trigger: nonAudioMetadata,
  processorFunction: deleteMetadatas,
  initialCursor: undefined
};

export const stripIgnoredNFTs: Processor = {
  name: 'stripIgnoredNFTs',
  trigger: ignoredNFTs,
  processorFunction: deleteRecords('nfts', 'stripIgnoredNFTs'),
  initialCursor: undefined
};
