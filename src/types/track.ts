import _ from 'lodash';

import { DBClient, Table } from '../db/db';

import { Record } from './record'

export type SubgraphTrack = {
  id: string
}

export type NFTTrackJoin = {
  nftId: string;
  processedTrackId: string;
}

export type ProcessedTrackAudio = { lossyAudioURL: string } | { lossyAudioIPFSHash: string } | { lossyAudioMimeType: string };
export type ProcessedTrackArtwork = { lossyArtworkURL: string } | { lossyArtworkIPFSHash: string } | { lossyArtworkMimeType: string };

export type ProcessedTrack = Record & {
  platformInternalId: string;
  title: string;
  slug: string;
  platformId: string;
  description?: string;
  websiteUrl?: string;
  artistId: string;
} & ProcessedTrackAudio & ProcessedTrackArtwork;

export const mergeProcessedTracks = async (newProcessedTracks: ProcessedTrack[], dbClient: DBClient, prioritizeNew: boolean) => {
  const platformInternalIds = newProcessedTracks.map(t => t.platformInternalId);
  const existingProcessedTracks = await dbClient.getRecords<ProcessedTrack>(Table.processedTracks,
    [
      ['whereIn', ['platformInternalId', platformInternalIds]]
    ]
  );
  const existingProcessedTracksByPlatformId = _.keyBy(existingProcessedTracks, 'platformInternalId');
  const oldIds = existingProcessedTracks.map(t => t.id);

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
      oldIds,
      mergedProcessedTracks
    }
  } else {
    return {
      mergedProcessedTracks
    }
  }
}
