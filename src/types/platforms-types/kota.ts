import _ from 'lodash';

import { slugify } from '../../utils/identifiers';
import { ArtistProfile } from '../artist';
import { MapTrack, MapNFTsToTrackIds } from '../mapping';
import { NFT, NftFactory } from '../nft';
import { ProcessedTrack } from '../track';

type NFTFile = {
  uri: string;
  type: string;
}

const mapTrack: MapTrack = (
  nft,
  apiTrack,
  contract?,
) => {

  if (!nft) {
    throw new Error(`NFT missing for mapArtistProfile for nft`)
  }

  const track: Partial<ProcessedTrack> = {
    id: mapNFTtoTrackID(nft),
    platformInternalId: nft.id,
    title: nft.metadata.name.split(' ').slice(0, -1).join(' '),
    description: nft.metadata.description,
    platformId: nft.platformId,
    lossyAudioURL: nft.metadata.properties.files.find(({ uri, type }: NFTFile) => type === 'audio/wav').uri,
    lossyArtworkURL: nft.metadata.properties.files.find(({ uri, type }: NFTFile) => type === 'image/png').uri,
    websiteUrl: nft.metadata.external_url,
    artistId: mapArtistProfile({ nft, contract }).artistId,
    createdAtTime: nft.createdAtTime,
    createdAtEthereumBlockNumber: nft.createdAtEthereumBlockNumber,
  };

  track.slug = slugify(`${track.title} ${track.createdAtTime!.getTime()}`);

  return track as ProcessedTrack;
};

const mapArtistProfile = ({ nft, contract }: { nft?: NFT, contract?: NftFactory }): ArtistProfile => {

  if (!nft) {
    throw new Error(`NFT missing for mapArtistProfile for nft`)
  }

  if (!contract?.typeMetadata?.overrides.artist?.artistId){
    throw new Error('Missing artistId override')
  }
  const artistId = contract.typeMetadata.overrides.artist.artistId;

  return {
    name: nft.metadata.symbol, // TODO
    artistId,
    platformInternalId: artistId,
    platformId: nft.platformId,
    avatarUrl: undefined,
    websiteUrl: `${nft.metadata.external_url}`,
    createdAtTime: nft.createdAtTime,
  }
};

const mapNFTtoTrackID = (nft: NFT): string => {
  return `solana/${nft.id}`
};

const mapNFTsToTrackIds: MapNFTsToTrackIds = (input) => {
  return _.groupBy(input.nfts, nft => mapNFTtoTrackID(nft));
}

export default {
  mapNFTsToTrackIds,
  mapTrack,
  mapArtistProfile
}
