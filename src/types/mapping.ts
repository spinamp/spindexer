import { DBClient } from '../db/db';

import { ArtistProfile } from './artist';
import { NFT, NftFactory } from './nft'
import { ProcessedTrack } from './track';

export type TrackMapping = {
  [trackId: string]: NFT[]
}

export type NFTtoTrackIdsInput = {
  nfts: NFT[],
  apiTracksByNFT?: any,
  contract?: NftFactory
}

export type MapNFTsToTrackIds = (input: NFTtoTrackIdsInput) => TrackMapping;
export type MapTrack = (nft: NFT, apiTrack: any, contract?: NftFactory, trackId?: string) => ProcessedTrack;
export type MapArtistProfile = ({ apiTrack, nft, contract }: { apiTrack: any, nft?: NFT, contract?: NftFactory }) => ArtistProfile
