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
  platformInternalId: string;
  title: string;
  slug: string;
  platformId: MusicPlatform;
  lossyAudioIPFSHash?: string;
  lossyAudioURL: string;
  description?: string;
  lossyArtworkIPFSHash?: string;
  lossyArtworkURL: string;
  websiteUrl?: string;
  artistId: string;
}

export type Track = Record & {
  platformId: MusicPlatform,
  metadataIPFSHash?: string
  [ValidContractCallFunction.tokenURI]?: string
  [ValidContractCallFunction.tokenMetadataURI]?: string
  metadata?: any
  metadataError?: string
  mimeType?: string
  processed?: true
  processError?: true
}

export const getMetadataURL = (track: Track): (string | null | undefined) => {
  const metadataField = platformConfig[track.platformId].contractMetadataField;
  const metadataURL = track[metadataField];
  return metadataURL;
}

export const getMetadataIPFSHash = (track: Track): (string | null | undefined) => {
  const metadataURL = getMetadataURL(track);
  if (!metadataURL) {
    return '';
  }
  const hash = extractHashFromURL(metadataURL);
  return hash || '';
}

export const mergeProcessedTracks = async (newProcessedTracks: ProcessedTrack[], dbClient: DBClient, prioritizeNew: boolean) => {
  const platformInternalIds = newProcessedTracks.map(t => t.platformInternalId);
  const existingProcessedTracks = await dbClient.getRecords<ProcessedTrack>('processedTracks',
    [
      ['whereIn', ['platformInternalId', platformInternalIds]]
    ]
  );
  const existingProcessedTracksByPlatformId = _.keyBy(existingProcessedTracks, 'platformId');
  const mergedProcessedTracks = newProcessedTracks.map(t => {
    if (prioritizeNew) {
      return {
        ...existingProcessedTracksByPlatformId[t.platformInternalId],
        ...t,
      }
    } else {
      return {
        ...t,
        ...existingProcessedTracksByPlatformId[t.platformInternalId],
      }
    }
  });
  if (prioritizeNew) {
    return {
      oldIds: existingProcessedTracks.map(t => t.id),
      mergedProcessedTracks
    }
  } else {
    return {
      mergedProcessedTracks
    }
  }
}
