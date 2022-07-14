
import { ArtistProfile } from '../artist';
import { ERC721NFT } from '../erc721nft';
import { ERC721Contract } from '../ethereum';
import { MapTrack } from '../processor';
import { ProcessedTrack } from '../track';

const mapTrack: MapTrack = (
  nft: ERC721NFT,
  apiTrack: any,
  contract?: ERC721Contract,
  trackId?: string,
): ProcessedTrack => {
  throw 'not implemented'

  // if (!contract) {
  //   throw new Error(`Contract missing for mapTrack for nft ${nft.id}`)
  // }

  // const track: Partial<ProcessedTrack> = {
  //   id: mapNFTtoTrackID(nft),
  //   platformInternalId: contract.address,
  //   title: contract.name || nft.metadata.name,
  //   description: nft.metadata.description,
  //   platformId: contract.platformId,
  //   lossyAudioIPFSHash: extractHashFromURL(nft.metadata.animation_url),
  //   lossyArtworkIPFSHash: extractHashFromURL(nft.metadata.image),
  //   websiteUrl: nft.metadata.external_url,
  //   artistId: contract.platformId,
  //   createdAtTime: nft.createdAtTime,
  //   createdAtEthereumBlockNumber: nft.createdAtEthereumBlockNumber,
  //   ...contract.typeMetadata?.overrides?.track
  // };

  // track.slug = slugify(`${track.title} ${nft.createdAtTime.getTime()}`).toLowerCase();

  // return track as ProcessedTrack;
};

const mapArtistProfile = ({ apiTrack, nft, contract }: { apiTrack: any, nft?: ERC721NFT, contract?: ERC721Contract }): ArtistProfile => {
  throw 'not implemented'

  // if (!nft) {
  //   throw new Error(`NFT missing for mapArtistProfile for nft`)
  // }
  // if (!contract) {
  //   throw new Error(`Contract missing for mapArtistProfile for nft ${nft.id}`)
  // }
  // return {
  //   name: contract.platformId, //set in db when contract is created in db
  //   artistId: contract.platformId,
  //   platformInternalId: contract.platformId,
  //   platformId: contract.platformId,
  //   avatarUrl: undefined,
  //   websiteUrl: nft.metadata.external_url,
  //   createdAtTime: nft.createdAtTime,
  //   createdAtEthereumBlockNumber: nft.createdAtEthereumBlockNumber,
  //   ...contract.typeMetadata?.overrides?.artist
  // }
};

const mapNFTtoTrackID = (nft: ERC721NFT): string => {
  // return `ethereum/${formatAddress(nft.contractAddress)}`;
  throw 'not implemented'

};

const mapNFTsToTrackIds = async (nfts: ERC721NFT[]): Promise<{ [trackId: string]: ERC721NFT[] }> => {
  throw 'not implemented'
  // return _.groupBy(nfts, nft => mapNFTtoTrackID(nft));
}

export default {
  mapNFTsToTrackIds,
  mapTrack,
  mapArtistProfile
}
