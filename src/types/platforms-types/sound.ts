import _ from 'lodash';
import slugify from 'slugify';

import { extractHashFromURL } from '../../clients/ipfs';
import sound from '../../clients/sound';
import { formatAddress } from '../address';
import { ArtistProfile } from '../artist';
import { ERC721NFT, getNFTMetadataField } from '../erc721nft';
import { ProcessedTrack } from '../track';

const mapAPITrackToArtistID = (apiTrack: any): string => {
  return `ethereum/${formatAddress(apiTrack.artist.user.publicAddress)}`;
};

const mapTrack = (
  nft: ERC721NFT,
  apiTrack: any
): ProcessedTrack => {
  if (!apiTrack.tracks[0].audio) {
    throw new Error('missing nft metadata audio_url');
  }
  return ({
    id: apiTrack.trackId,
    platformInternalId: apiTrack.id,
    title: apiTrack.title,
    slug: slugify(`${apiTrack.title} ${nft.createdAtTime.getTime()}`).toLowerCase(),
    description: apiTrack.description,
    platformId: nft.platformId,
    lossyAudioURL: apiTrack.tracks[0].audio.url || nft.metadata.audio_url,
    lossyArtworkIPFSHash: extractHashFromURL(getNFTMetadataField(nft, 'image')),
    lossyAudioIPFSHash: extractHashFromURL(getNFTMetadataField(nft, 'animation_url')),
    createdAtTime: nft.createdAtTime,
    createdAtEthereumBlockNumber: nft.createdAtEthereumBlockNumber,
    lossyArtworkURL: apiTrack.coverImage.url,
    websiteUrl:
      apiTrack.artist.soundHandle && apiTrack.titleSlug
        ? `https://www.sound.xyz/${apiTrack.artist.soundHandle}/${apiTrack.titleSlug}`
        : 'https://www.sound.xyz',
    artistId: mapAPITrackToArtistID(apiTrack),
  })
};

const mapArtistProfile = ({ apiTrack, nft }: { apiTrack: any, nft?: ERC721NFT }): ArtistProfile => {
  const artist = apiTrack.artist
  return {
    name: artist.name,
    artistId: mapAPITrackToArtistID(apiTrack),
    platformInternalId: artist.id,
    platformId: nft!.platformId,
    avatarUrl: artist.user.avatar.url,
    websiteUrl: artist.soundHandle ?
      `https://www.sound.xyz/${artist.soundHandle}`
      : 'https://www.sound.xyz',
    createdAtTime: nft!.createdAtTime,
    createdAtEthereumBlockNumber: nft!.createdAtEthereumBlockNumber
  }
};

const mapNFTsToTrackIds = async (nfts: ERC721NFT[]): Promise<{ [trackId: string]: ERC721NFT[] }> => {
  const soundClient = await sound.init();
  const tracksByNFT = await soundClient.fetchTracksByNFT(nfts);
  return _.groupBy(nfts, nft => tracksByNFT[nft.id]);
}

export default {
  mapNFTsToTrackIds,
  mapTrack,
  mapArtistProfile
}
