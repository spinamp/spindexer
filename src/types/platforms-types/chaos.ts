import _ from 'lodash';

import { extractHashFromURL } from '../../clients/ipfs';
import { ethereumTrackId, slugify } from '../../utils/identifiers';
import { ArtistProfile } from '../artist';
import { MapTrack, MapNFTsToTrackIds } from '../mapping';
import { NFT, getTrait, NftFactory } from '../nft';

const mapTrack: MapTrack = (
  nft,
  apiTrack,
  contract?,
) => {
  if (!contract) {
    throw new Error(`Contract missing for mapTrack for nft ${nft.id}`)
  }
  const song = getSong(nft);
  return ({
    id: mapNFTtoTrackID(nft),
    platformInternalId: song,
    title: song,
    slug: slugify(`${song} ${nft.createdAtTime.getTime()}`),
    description: nft.metadata.description,
    platformId: contract.platformId,
    lossyAudioIPFSHash: extractHashFromURL(nft.metadata.animation_url)!,
    lossyArtworkIPFSHash: extractHashFromURL(nft.metadata.image)!,
    websiteUrl: 'https://www.chaos.build/',
    artistId: contract.id,
    createdAtTime: nft.createdAtTime,
    createdAtEthereumBlockNumber: nft.createdAtEthereumBlockNumber,
  })
};

const mapArtistProfile = ({ apiTrack, nft, contract }: { apiTrack: any, nft?: NFT, contract?: NftFactory }): ArtistProfile => {
  if (!nft) {
    throw new Error(`NFT missing for mapArtistProfile for nft`)
  }
  if (!contract) {
    throw new Error(`Contract missing for mapArtistProfile for nft ${nft.id}`)
  }
  return {
    name: contract.name!, //set in db when contract is created in db
    artistId: contract.id,
    platformInternalId: contract.id,
    platformId: contract.platformId,
    avatarUrl: 'https://lh3.googleusercontent.com/UMytoAeoFW6hGHO3vjIUD28qcKerddfLZP3i2R2g9FS_5IOe7aCSSPosI13VxTFIqw7PgpIOlUSMJrc5jDYf8VbC-4degSMuoXbISw=s0',
    websiteUrl: 'https://www.chaos.build/',
    createdAtTime: nft.createdAtTime,
    createdAtEthereumBlockNumber: nft.createdAtEthereumBlockNumber
  }
};

const getSong = (nft: NFT) => getTrait(nft, 'Song');

const mapNFTtoTrackID = (nft: NFT): string => {
  const song = getSong(nft);
  return ethereumTrackId(nft.contractAddress, song);
};

const mapNFTsToTrackIds: MapNFTsToTrackIds = (nftToTrackIdSource) => {
  return _.groupBy(nftToTrackIdSource.nfts, nft => mapNFTtoTrackID(nft));
}

export default {
  mapNFTsToTrackIds,
  mapTrack,
  mapArtistProfile
}
