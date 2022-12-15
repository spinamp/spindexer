import { Knex } from 'knex';
import _ from 'lodash';

import { RELICS_SEASON_1_FACTORY } from '../../constants/artistIntegrations';
import { CrdtOperation } from '../../types/message';
import { Table } from '../db';

export const up = async (knex: Knex) => {
  console.log('Removing RELICS season 1 data for reindexing');
  const tracks = await knex(Table.processedTracks).where({ platformId: 'relics' })
  console.log('# of tracks:');
  console.log(tracks.length);

  const artworkCids = _.compact(_.uniq(tracks.map((track) => track.lossyArtworkIPFSHash)));
  const artworkUrls = _.compact(_.uniq(tracks.map((track) => track.lossyArtworkUrl)));

  console.log('# of cids:');
  console.log(artworkCids.length);
  console.log('# of urls:');
  console.log(artworkUrls.length);

  // remove relics tracks
  await knex(Table.processedTracks).where({ platformId: 'relics' }).del()

  // remove ipfsFiles
  if (artworkCids.length > 0) {
    await knex(Table.ipfsFiles).whereIn('cid', artworkCids).del()
  }

  // remove ipfsPins
  if (artworkUrls.length > 0) {
    await knex(Table.ipfsPins).whereIn('id', artworkCids).del()
  }

  const factories: any[] = [RELICS_SEASON_1_FACTORY].map((factory) => ({
    timestamp: new Date(),
    table: Table.nftFactories,
    data: factory,
    operation: CrdtOperation.UPSERT,
  }))
  await knex(Table.seeds).insert(factories)
}

export const down = async (knex: Knex) => {
  // No Operation
}
