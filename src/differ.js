// This script was used to diff an old version of the DB with a new one and ensure nothing has been lost.
// It should no longer be in use, though is being kept until
// the migration is 100% completed.

const orig = require('../../app/src/db/preloadedData/preloadedData.json');
const neww = require('../localdb/db.json');
const _ = require('lodash');

const origTracks = orig.tracks.items; // map
const origArtists = orig.artists.items; // map
const processedTracks = neww.processedTracks; // array
const newArtists = neww.artists; // array
const processedTracksById = _.keyBy(processedTracks, 'id');
const newArtistsById = _.keyBy(newArtists, 'id');
const processedTracksByPlatformId = _.keyBy(processedTracks, 'platformId');
const newArtistsByPlatformId = _.keyBy(newArtists, 'profiles.noizd.platformId');

const diffProfile = (oldProfile, newProfile) => {
  const diff = {};
  const oldProfileKeys = Object.keys(oldProfile);
  const newProfileKeys = Object.keys(newProfile);
  oldProfileKeys.forEach(keyOld => {
    let keyNew = keyOld;
    if (keyOld === 'provider') {
      keyNew = 'platform'
    }
    if (keyOld === 'originalId') {
      keyNew = 'platformId'
    }
    if (keyOld === 'id') {
      keyNew = 'artistId'
    }
    if (keyOld === 'provider' && oldProfile[keyOld] === 'soundXyz' && newProfile[keyNew] === 'sound') {
      return
    }
    if (keyOld === 'createdAt') {
      keyNew = 'createdAtTimestamp'
      return;
    }
    if (!(oldProfile[keyOld] === newProfile[keyNew])) {
      diff[keyOld] = { old: oldProfile[keyOld], new: newProfile[keyNew] }
    }
  });
  newProfileKeys.forEach(keyNew => {
    let keyOld = keyNew;
    if (keyNew === 'platform') {
      keyOld = 'provider'
    }
    if (keyNew === 'platformId') {
      keyOld = 'originalId'
    }
    if (keyOld === 'artistId') {
      keyNew = 'id'
    }
    if (keyNew === 'platformId' && oldProfile[keyOld] === 'soundXyz' && newProfile[keyNew] === 'sound') {
      return
    }
    if (keyNew === 'createdAtTimestamp') {
      keyOld = 'createdAt'
      return;
    }
    if (!(oldProfile[keyOld] === newProfile[keyNew])) {
      diff[keyOld] = { old: oldProfile[keyOld], new: newProfile[keyNew] }
    }
  });
  if (Object.keys(diff).length === 0) {
    return undefined;
  }
  return diff;
}

const diffProfiles = (oldProfiles, newProfiles) => {
  const diff = {};
  const oldProfilesKeys = Object.keys(oldProfiles);
  const newProfilesKeys = Object.keys(newProfiles);
  oldProfilesKeys.forEach(keyOld => {
    let keyNew = keyOld;
    if (keyOld === 'soundXyz') {
      keyNew = 'sound'
    }
    const diffedProfile = diffProfile(oldProfiles[keyOld], newProfiles[keyNew])
    if (diffedProfile) {
      diff[keyOld] = diffedProfile
    }
  });
  newProfilesKeys.forEach(keyNew => {
    let keyOld = keyNew;
    if (keyNew === 'sound') {
      keyOld = 'soundXyz'
    }
    const diffedProfile = diffProfile(oldProfiles[keyOld], newProfiles[keyNew])
    if (diffedProfile) {
      diff[keyOld] = diffedProfile
    }
  });
  if (Object.keys(diff).length === 0) {
    return undefined;
  }
  return diff;
}

const diffArtist = (oldArtist, newArtist, full) => {
  const diff = {};
  if (!oldArtist) {
    return;
  }
  if (!newArtist) {
    return { old: oldArtist, new: undefined };
  }
  const oldKeys = Object.keys(oldArtist);
  oldKeys.forEach(keyOld => {
    let keyNew = keyOld;
    if (keyOld === 'profiles' && full) {
      const diffedProfiles = diffProfiles(oldArtist.profiles, newArtist.profiles, true)
      if (diffedProfiles) {
        diff['profiles'] = diffedProfiles
      }
      return;
    }
    if (keyOld === 'profiles' && !full) {
      return;
    }
    if (keyOld === 'createdAt') {
      keyNew = 'createdAtTimestamp'
      return;
    }
    if (!(oldArtist[keyOld] === newArtist[keyNew])) {
      diff[keyOld] = { old: oldArtist[keyOld], new: newArtist[keyNew] }
    }
  });
  const newKeys = Object.keys(newArtist);
  newKeys.forEach(keyNew => {
    let keyOld = keyNew;
    if (keyOld === 'profiles' && full) {
      const diffedProfiles = diffProfiles(oldArtist.profiles, newArtist.profiles, true)
      if (diffedProfiles) {
        diff['profiles'] = diffedProfiles
      }
      return;
    }
    if (keyNew === 'profiles' && !full) {
      return;
    }
    if (keyNew === 'createdAtTimestamp') {
      keyOld = 'createdAt'
      return;
    }
    if (keyNew === 'slug') {
      return;
    }
    if (!(oldArtist[keyOld] === newArtist[keyNew])) {
      diff[keyNew] = { old: oldArtist[keyOld], new: newArtist[keyNew] }
    }
  });
  if (Object.keys(diff).length === 0) {
    return undefined;
  }
  return diff;
}

const diffTrack = (oldTrack, newTrack) => {
  const diff = {};
  if (!oldTrack) {
    return undefined;
  }
  if (!newTrack) {
    // console.log({ oldTrack, newTrack })
    // throw Error("qq");
    return { old: oldTrack, new: undefined };
  }
  const oldKeys = Object.keys(oldTrack);
  if (oldKeys.length === 0) {
    return { old: undefined, new: newTrack };
  }
  const newKeys = Object.keys(newTrack);
  if (newKeys.length === 0) {
    return { old: oldTrack, new: undefined };
  }
  oldKeys.forEach(keyOld => {
    let keyNew = keyOld;
    if (keyOld === 'provider') {
      keyNew = 'platform'
    }
    if (keyOld === 'originalId') {
      keyNew = 'platformId'
    }
    if (keyOld === 'artwork') {
      keyNew = 'lossyArtworkURL'
    }
    if (keyOld === 'url') {
      keyNew = 'lossyAudioURL'
    }
    if (keyOld === 'createdAt') {
      keyNew = 'createdAtTimestamp'
      return;
    }
    if (keyOld === 'provider' && oldTrack[keyOld] === 'soundXyz' && newTrack[keyNew] === 'sound') {
      return
    }
    if (keyOld === 'url' && oldTrack.provider === 'noizd' && newTrack.id.split('/')[2] <= 28) {
      return;
    }
    if (keyOld === 'artist') {
      const diffedArtist = diffArtist(oldTrack.artist, newTrack.artist, false)
      if (diffedArtist) {
        diff['artist'] = diffedArtist
      }
      return;
    }
    if (!(oldTrack[keyOld] === newTrack[keyNew])) {
      diff[keyOld] = { old: oldTrack[keyOld], new: newTrack[keyNew] }
    }
  });
  newKeys.forEach(keyNew => {
    let keyOld = keyNew;
    if (keyNew === 'platform') {
      keyOld = 'provider'
    }
    if (keyNew === 'platformId') {
      keyOld = 'originalId'
    }
    if (keyNew === 'lossyArtworkURL') {
      keyOld = 'artwork'
    }
    if (keyNew === 'lossyAudioURL') {
      keyOld = 'url'
    }
    if (keyNew === 'createdAtTimestamp') {
      keyOld = 'createdAt'
      return;
    }
    if (keyNew === 'lossyAudioIPFSHash') {
      return;
    }
    if (keyNew === 'lossyArtworkIPFSHash') {
      return;
    }
    if (keyNew === 'lossyAudioURL' && newTrack.platform === 'noizd' && newTrack.id.split('/')[2] <= 28) {
      return;
    }
    if (keyNew === 'platform' && oldTrack[keyOld] === 'soundXyz' && newTrack[keyNew] === 'sound') {
      return
    }
    if (keyNew === 'slug') {
      return
    }
    if (keyNew === 'artist') {
      const diffedArtist = diffArtist(oldTrack.artist, newTrack.artist, false)
      if (diffedArtist) {
        diff['artist'] = diffedArtist
      }
      return;
    }
    if (!(oldTrack[keyOld] === newTrack[keyNew])) {
      diff[keyNew] = { old: oldTrack[keyOld], new: newTrack[keyNew] }
    }
  });
  if (Object.keys(diff).length === 0) {
    return undefined;
  }
  return diff;
}

const diffTracks = (oldTracks, newTracks) => {
  const diff = {};
  const oldTracksKeys = Object.keys(oldTracks);
  const newTracksKeys = Object.keys(newTracks);
  oldTracksKeys.forEach(keyOld => {
    let keyNew = keyOld;
    let newTrack = newTracks[keyNew];
    const trackPlatformId = oldTracks[keyOld].originalId;
    if (keyOld === 'ethereum/0xabefbc9fd2f806065b4f3c237d4b59d9a97bcac7/null') {
      return {};
    }
    if (oldTracks[keyOld].provider === 'noizd' && processedTracksByPlatformId[trackPlatformId]) {
      newTrack = processedTracksByPlatformId[trackPlatformId];
    }
    const diffedTrack = diffTrack(oldTracks[keyOld], newTrack)
    if (diffedTrack) {
      delete diffedTrack.id;
      if (Object.keys(diffedTrack).length !== 0) {
        diff[keyOld] = diffedTrack
      }
    }
  });
  newTracksKeys.forEach(keyNew => {
    let keyOld = keyNew;
    if (newTracks[keyNew].platform === 'noizd' && oldTracks[`noizd/${newTracks[keyNew].platformId}`]) {
      keyOld = `noizd/${newTracks[keyNew].platformId}`;
    }
    const diffedTrack = diffTrack(oldTracks[keyOld], newTracks[keyNew])
    if (diffedTrack) {
      delete diffedTrack.id;
      if (Object.keys(diffedTrack).length !== 0) {
        diff[keyNew] = diffedTrack
      }
    }
  });
  if (Object.keys(diff).length === 0) {
    return undefined;
  }
  return diff;
}

const diffArtists = (oldArtists, newArtists) => {
  const diff = {};
  const oldArtistsKeys = Object.keys(oldArtists);
  const newArtistsKeys = Object.keys(newArtists);
  oldArtistsKeys.forEach(keyOld => {
    let keyNew = keyOld;
    const diffedArtist = diffArtist(oldArtists[keyOld], newArtists[keyNew])
    if (diffedArtist) {
      diff[keyOld] = diffedArtist
    }
  });
  newArtistsKeys.forEach(keyNew => {
    let keyOld = keyNew;
    const diffedArtist = diffArtist(oldArtists[keyOld], newArtists[keyNew])
    if (diffedArtist) {
      diff[keyNew] = diffedArtist
    }
  });
  if (Object.keys(diff).length === 0) {
    return undefined;
  }
  return diff;
}

const diffedTracks = diffTracks(origTracks, processedTracksById);
console.dir({ diffedTracks }, { depth: null })

const diffedArtists = diffArtists(origArtists, newArtistsById);
console.dir({ diffedArtists }, { depth: null })

console.log(`${Object.keys(diffedTracks || {}).length} tracks difference`)
console.log(`${Object.keys(diffedArtists || {}).length} artists difference`)

const test = 'ethereum/0x927317525e6e2d04e773b1dbab614a808e4ba855'
// console.dir({ diffy: diffArtist(origArtists, newArtistsById) }, { depth: null })
