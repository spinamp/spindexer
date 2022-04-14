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
  slug: string;
  platform: MusicPlatform;
  lossyAudioIPFSHash?: string;
  lossyAudioURL: string;
  description?: string;
  artwork?: string;
  lossyArtworkIPFSHash?: string;
  lossyArtworkURL: string;
  websiteUrl?: string;
  artistId: string;
}

export type Track = Record & {
  platform: MusicPlatform,
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
  const metadataField = platformConfig[track.platform].contractMetadataField;
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
  const platformIds = newProcessedTracks.map(t => t.platformId);
  const existingProcessedTracks = await dbClient.getRecords<ProcessedTrack>('processedTracks',
    [
      ['whereIn', ['platformId', platformIds]]
    ]
  );
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
