import _ from 'lodash';

import { DBClient, Table } from '../db/db';

import { MusicPlatform } from './platform'
import { Record } from './record'

export type SubgraphTrack = {
  id: string
}

export type NFTProcessError = {
  erc721nftId: string;
  processError: string;
}

export type NFTTrackJoin = {
  erc721nftId: string;
  processedTrackId: string;
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

export const mergeProcessedTracks = async (newProcessedTracks: ProcessedTrack[], dbClient: DBClient, prioritizeNew: boolean) => {
  const platformInternalIds = newProcessedTracks.map(t => t.platformInternalId);
  const existingProcessedTracks = await dbClient.getRecords<ProcessedTrack>(Table.processedTracks,
    [
      ['whereIn', ['platformInternalId', platformInternalIds]]
    ]
  );
  const newProcessedTracksById = _.keyBy(existingProcessedTracks, 'id');
  const existingProcessedTracksByPlatformId = _.keyBy(existingProcessedTracks, 'platformInternalId');
  const oldIds = existingProcessedTracks.map(t => t.id).filter(id => {
    newProcessedTracksById[id]
  });
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
