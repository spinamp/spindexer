import { Axios } from 'axios';

import { BlocksClient } from '../clients/blocks';
import { CatalogClient } from '../clients/catalog';
import { EthClient } from '../clients/ethereum';
import { IPFSClient } from '../clients/ipfs';
import { NOIZDClient } from '../clients/noizd';
import { SoundClient } from '../clients/sound';
import { DBClient } from '../db/db';

import { ERC721NFT } from './erc721nft';
import { ERC721Contract } from './ethereum';
import { ProcessedTrack } from './track';
import { Cursor, Trigger } from './trigger';

export type TrackAPIClient = {
  fetchTracksByTrackId: (trackIds: string[]) => Promise<any[]>;
}

export type TrackAPIClientWithPremints = TrackAPIClient & {
  fetchLatestTrackCursor: () => Promise<string>;
  getTracksFrom: (cursor: string) => Promise<any[]>;
  getAPITrackCursor: (track: any) => string
  mapAPITrack: (apiTrack: any) => ProcessedTrack
}

export type Clients = {
  eth: EthClient,
  db: DBClient,
  blocks: BlocksClient,
  axios: Axios,
  ipfs: IPFSClient,
  catalog: CatalogClient,
  sound: SoundClient,
  noizd: NOIZDClient
}

export type Processor = {
  name?: string,
  trigger: Trigger<Cursor | undefined>,
  processorFunction: (newTriggerItems: any, clients: Clients) => Promise<void>;
  initialCursor?: Cursor | undefined;
};

export type MapTrack = (nft: ERC721NFT, apiTrack: any, contract?: ERC721Contract | undefined, trackId?: string, overrides?: Partial<ProcessedTrack>) => ProcessedTrack;