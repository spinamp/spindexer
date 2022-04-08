import _ from "lodash";
import { ValidContractCallFunction } from "../clients/ethereum";
import { extractHashFromURL } from "../clients/ipfs";
import { DBClient } from "../db/db";
import { MusicPlatform, platformConfig } from "./platform"
import { Record } from "./record"

export type SubgraphTrack = {
  id: string
}

export type ProcessedTrack = Record & {
  platformId: string;
  title: string;
  platform: MusicPlatform;
  lossyAudioIPFSHash?: string;
  lossyAudioURL: string;
  description?: string;
  artwork?: string;
  lossyArtworkIPFSHash?: string;
  lossyArtworkURL: string;
  websiteUrl?: string;
  artistId: string;
  artist: { id: string, name: string };
}

export type Track = {
  id: string,
  platform: MusicPlatform,
  metadataIPFSHash?: string
  createdAtBlockNumber: string
  [ValidContractCallFunction.tokenURI]?: string
  [ValidContractCallFunction.tokenMetadataURI]?: string
  metadata?: any
  metadataError?: string
  processed?: true
  processError?: true
}

export const getMetadataURL = (track: Track): (string | null | undefined) => {
  const metadataField = platformConfig[track.platform].contractMetadataField;
  const metadataURL = track[metadataField];
  return metadataURL;
}

export const getMetadataIPFSHash = (track: Track): (string | null | undefined) => {
  const metadataURL = getMetadataURL(track);
  if (!metadataURL) {
    return null;
  }
  const hash = extractHashFromURL(metadataURL);
  return hash || null;
}

export const mergeProcessedTracks = async (newProcessedTracks: ProcessedTrack[], dbClient: DBClient, prioritizeNew: boolean) => {
  const platformIds = newProcessedTracks.map(t => t.platformId);
  const existingProcessedTracks = await dbClient.getRecords<ProcessedTrack>('processedTracks', {
    where:
    {
      key: 'platformId',
      valueIn: platformIds
    }
  });
  const existingProcessedTracksByPlatformId = _.keyBy(existingProcessedTracks, 'platformId');
  const mergedProcessedTracks = newProcessedTracks.map(t => {
    if (prioritizeNew) {
      return {
        ...existingProcessedTracksByPlatformId[t.platformId],
        ...t,
      }
    } else {
      return {
        ...t,
        ...existingProcessedTracksByPlatformId[t.platformId],
      }
    }
  });
  return mergedProcessedTracks;
}
