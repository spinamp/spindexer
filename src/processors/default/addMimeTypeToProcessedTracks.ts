import _ from 'lodash';

import { Table } from '../../db/db';
import { ArtworkTypes } from '../../types/media';
import { NFT } from '../../types/nft';
import { Clients, Processor } from '../../types/processor';
import { ProcessedTrack } from '../../types/track';
import { Trigger } from '../../types/trigger';
import { rollPromises } from '../../utils/rollingPromises';

export enum SourceIPFS {
  AUDIO = 'Audio',
  ARTWORK = 'Artwork'
}

export type TrackNftJoin = ProcessedTrack & Partial<NFT>;

const TIMEOUT = parseInt(process.env.METADATA_REQUEST_TIMEOUT!)
const QUERY_LIMIT = process.env.QUERY_TRIGGER_BATCH_SIZE

const missingMimeType: (source: SourceIPFS) => Trigger<undefined> = (source) => {
  return async (clients) => {
    // find approved tracks (and the nftID) which are missing a mimeType; skipping any which have had errors
    const query = `select p.*, n.id as "nftId"
      FROM "${Table.nfts}" as n
      LEFT OUTER JOIN "${Table.nfts_processedTracks}" as j
      ON n.id = j."nftId"
      LEFT OUTER JOIN "${Table.processedTracks}" as p
      ON j."processedTrackId" = p.id
      LEFT OUTER JOIN "${Table.nftProcessErrors}" as e
      ON n.id = e."nftId"
      WHERE n.approved = true AND
      e."processError" is NULL AND
      e."metadataError" is NULL AND
      p."lossy${source}MimeType" is NULL AND
      p."lossy${source}IPFSHash" is NOT NULL
      LIMIT ${QUERY_LIMIT}`

    const processedTracks = (await clients.db.rawSQL(query)).rows;
    return processedTracks;
  }
}

export const addMimeTypeToProcessedTracks: (source: SourceIPFS) => Processor =
  (source) => ({
    name: `addLossy${source}MimeTypeToProcessedTracks`,
    trigger: missingMimeType(source),
    processorFunction: async (input: TrackNftJoin[], clients: Clients) => {
      console.log(`Fetching processed track ${source} mime types`);

      const metadataErrors: { metadataError: string, nftId: string }[] = [];

      const updatedMimeTypes = async (trackNftJoin: any) => {
        const ipfsHash = trackNftJoin[`lossy${source}IPFSHash`];
        let response: any;

        try {
          response = await clients.axios.head(`${process.env.IPFS_ENDPOINT}${ipfsHash}`, { timeout: TIMEOUT })
        } catch {
          // TODO: error when request fails
        }

        const contentType = response.headers['content-type']

        const result: any = { id: trackNftJoin.id, nftId: trackNftJoin.nftId, metadataError: undefined }

        if (contentType && ArtworkTypes.includes(contentType)) {
          result[`lossy${source}MimeType`] = contentType
        } else {
          result.metadataError = `Invalid ${source} mime type: ${contentType}`
        }

        return result;
      }

      const results = await rollPromises<TrackNftJoin, any, void>(
        input,
        updatedMimeTypes,
      );
      // console.log(results);

      const [valid, invalid] = _.partition(results.map(result => result.response), el => el.metadataError === undefined);
      const updates = valid.map(update => _.pick(update, ['id', `lossy${source}MimeType`]))
      const errors = invalid.map(error => _.pick(error, ['nftId', 'metadataError']))

      // console.log(updates)
      // console.log(errors)

      if (updates.length > 0) {
        await clients.db.update(Table.processedTracks, updates);
      }
      if (errors.length > 0) {
        await clients.db.upsert(Table.nftProcessErrors, errors, 'nftId');
      }
    },
    initialCursor: undefined
  })
