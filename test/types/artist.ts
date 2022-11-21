import assert from 'assert';

import { ArtistProfile, distinctEarliestArtistProfiles } from '../../src/types/artist';

describe('artist', () => {
  describe('distinctEarliestArtistProfiles', () => {
    const profiles: ArtistProfile[] = [
      { artistId: '0x1', name: 'older', createdAtBlockNumber: '1', platformId: '1', platformInternalId: '1', createdAtTime: new Date(0) },
      { artistId: '0x1', name: 'newer', createdAtBlockNumber: '2', platformId: '1', platformInternalId: '1', createdAtTime: new Date(0) },
      { artistId: '0x2', name: '-----', createdAtBlockNumber: '2', platformId: '1', platformInternalId: '1', createdAtTime: new Date(0) },
      { artistId: '0x3', name: 'blockless1', createdAtBlockNumber: undefined, platformId: '1', platformInternalId: '1', createdAtTime: new Date(0) },
      { artistId: '0x3', name: 'blocky', createdAtBlockNumber: '3', platformId: '1', platformInternalId: '1', createdAtTime: new Date(0) },
    ]

    it('dedups and returns the earliest artist profiles ', () => {
      const result = distinctEarliestArtistProfiles(profiles);
      assert.equal(result.length, 3);
      assert.equal(result[0].name, 'older');
      assert.equal(result[1].name, '-----');
      assert.equal(result[2].name, 'blocky');
    })
  })
})
