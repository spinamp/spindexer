import _ from 'lodash';
import slugify from 'slugify';

import { extractHashFromURL } from '../../clients/ipfs';
import { formatAddress } from '../address';
import { ArtistProfile } from '../artist';
import { ERC721NFT, getTrait } from '../erc721nft';
import { ERC721Contract } from '../ethereum';
import { ProcessedTrack } from '../track';

const mapTrack = (
  nft: ERC721NFT,
  apiTrack: any,
  contract?: ERC721Contract,
): ProcessedTrack => {
  if (!contract) {
    throw new Error(`Contract missing for mapTrack for nft ${nft.id}`)
  }
  const song = getSong(nft);
  return ({
    id: mapNFTtoTrackID(nft),
    platformInternalId: song,
    title: song,
    slug: slugify(`${song} ${nft.createdAtTime.getTime()}`).toLowerCase(),
    description: nft.metadata.description,
    platformId: contract.platformId,
    lossyAudioIPFSHash: extractHashFromURL(nft.metadata.animation_url),
    lossyArtworkIPFSHash: extractHashFromURL(nft.metadata.image),
    websiteUrl: 'https://www.chaos.build/',
    artistId: contract.address,
    createdAtTime: nft.createdAtTime,
    createdAtEthereumBlockNumber: nft.createdAtEthereumBlockNumber,
  })
};

const mapArtistProfile = ({ apiTrack, nft, contract }: { apiTrack: any, nft?: ERC721NFT, contract?: ERC721Contract }): ArtistProfile => {
  if (!nft) {
    throw new Error(`NFT missing for mapArtistProfile for nft`)
  }
  if (!contract) {
    throw new Error(`Contract missing for mapArtistProfile for nft ${nft.id}`)
  }
  return {
    name: contract.name!, //set in db when contract is created in db
    artistId: contract.address,
    platformInternalId: contract.address,
    platformId: contract.platformId,
    avatarUrl: 'https://lh3.googleusercontent.com/UMytoAeoFW6hGHO3vjIUD28qcKerddfLZP3i2R2g9FS_5IOe7aCSSPosI13VxTFIqw7PgpIOlUSMJrc5jDYf8VbC-4degSMuoXbISw=s0',
    websiteUrl: 'https://www.chaos.build/',
    createdAtTime: nft.createdAtTime,
    createdAtEthereumBlockNumber: nft.createdAtEthereumBlockNumber
  }
};

const getSong = (nft: ERC721NFT) => getTrait(nft, 'Song');

const mapNFTtoTrackID = (nft: ERC721NFT): string => {
  const song = getSong(nft);
  return `ethereum/${formatAddress(nft.contractAddress)}/${song}`;
};

const mapNFTsToTrackIds = async (nfts: ERC721NFT[]): Promise<{ [trackId: string]: ERC721NFT[] }> => {
  return _.groupBy(nfts, nft => mapNFTtoTrackID(nft));
}

export default {
  mapNFTsToTrackIds,
  mapTrack,
  mapArtistProfile
}
