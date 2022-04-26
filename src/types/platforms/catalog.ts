import { toUtf8Bytes, verifyMessage } from 'ethers/lib/utils';

// import _ from 'lodash';
// import slugify from 'slugify';

import { ArtistProfile } from '../artist';
import { ERC721NFT } from '../erc721nft';
import { MusicPlatform } from '../platform';
import { Clients } from '../processor';
import { NFTProcessError, NFTTrackJoin, ProcessedTrack } from '../track';

// import { CatalogClient } from '../../clients/catalog';
// import { formatAddress } from '../address';
// import { ArtistProfile } from '../artist';

export const recoverCatalogAddress = (body: any, signature: string) => {
  const bodyString = JSON.stringify(body);
  const bodyHex = (toUtf8Bytes(bodyString));
  const recovered = verifyMessage(bodyHex, signature).toLowerCase();
  return recovered;
};

export const verifyCatalogTrack = (nft: ERC721NFT) => {
  const CATALOG_ETHEREUM_ADDRESS = '0xc236541380fc0C2C05c2F2c6c52a21ED57c37952'.toLowerCase();
  if (!nft.metadata) {
    throw new Error(`Full metadata missing for record ${nft.id}`)
  }
  if (!nft.metadata.origin) {
    return false;
  }
  const signature = nft.metadata.origin.signature;
  const body = nft.metadata.body;
  return signature && body && recoverCatalogAddress(body, signature) === CATALOG_ETHEREUM_ADDRESS;
}

export const getZoraPlatform = (nft: ERC721NFT) => {
  if (nft.platformId !== MusicPlatform.zora) {
    throw new Error('Bad track platform being processed')
  }
  if (verifyCatalogTrack(nft)) {
    return MusicPlatform.catalog;
  } else {
    return MusicPlatform.zoraRaw
  }
}

// const getTokenIdFromMetadata = (metadata: Metadata) => {
//   return metadata.nftId.split('/')[1];
// }


// const mapTrackID = (metadataId: string): string => {
//   const [contractAddress, nftId] = metadataId.split('/');
//   return `ethereum/${formatAddress(contractAddress)}/${nftId}`;
// };

// const mapArtistID = (artistId: string): string => {
//   return `ethereum/${formatAddress(artistId)}`;
// };

// const mapTrack = (item: {
//   metadata: Metadata;
//   platformTrackResponse?: any;
// }): ProcessedTrack => ({
//   id: mapTrackID(item.metadata.id),
//   platformInternalId: item.platformTrackResponse.id,
//   title: item.platformTrackResponse.title,
//   slug: slugify(`${item.platformTrackResponse.title} ${item.metadata.createdAtTime.getTime()}`).toLowerCase(),
//   description: item.platformTrackResponse.description,
//   platformId: MusicPlatform.catalog,
//   lossyAudioIPFSHash: item.platformTrackResponse.ipfs_hash_lossy_audio,
//   lossyAudioURL: `https://catalogworks.b-cdn.net/ipfs/${item.platformTrackResponse.ipfs_hash_lossy_audio}`,
//   createdAtTime: item.metadata.createdAtTime,
//   createdAtEthereumBlockNumber: item.metadata.createdAtEthereumBlockNumber,
//   lossyArtworkIPFSHash: item.platformTrackResponse.ipfs_hash_lossy_artwork,
//   lossyArtworkURL: `https://catalogworks.b-cdn.net/ipfs/${item.platformTrackResponse.ipfs_hash_lossy_artwork}`,
//   websiteUrl:
//   item.platformTrackResponse.artist.handle && item.platformTrackResponse.short_url
//       ? `https://beta.catalog.works/${item.platformTrackResponse.artist.handle}/${item.platformTrackResponse.short_url}`
//       : 'https://beta.catalog.works',
//   artistId: mapArtistID(item.platformTrackResponse.artist.id),
// });

// export const mapArtistProfile = (platformResponse: any, createdAtTime: Date, createdAtEthereumBlockNumber?: string): ArtistProfile => {
//   const artist = platformResponse.artist;
//   return {
//     name: artist.name,
//     artistId: mapArtistID(artist.id),
//     platformInternalId: artist.id,
//     platformId: MusicPlatform.catalog,
//     avatarUrl: artist.picture_uri,
//     websiteUrl: artist.handle
//       ? `https://beta.catalog.works/${artist.handle}`
//       : 'https://beta.catalog.works',
//     createdAtTime,
//     createdAtEthereumBlockNumber
//   }
// };

// const addPlatformTrackData = async (metadatas: Metadata[], client: CatalogClient) => {
//   const trackTokenIds = metadatas.map(m => getTokenIdFromMetadata(m));
//   const platformTracks = await client.fetchCatalogTracksByNFT(trackTokenIds);
//   const platformTrackDataByTokenId = _.keyBy(platformTracks, 'nft_id');
//   const platformTrackData: { metadata: Metadata, platformTrackResponse: any }[]
//     = metadatas.map(metadata => {
//       const platformTrackResponse = platformTrackDataByTokenId[getTokenIdFromMetadata(metadata)] || {
//         isError: true,
//         error: new Error(`Missing platform track data`)
//       }
//       return {
//         metadata,
//         platformTrackResponse
//       };
//   });
//   return platformTrackData;
// }


const mapNFTsToTrackIds = (nfts:ERC721NFT[]):{ [trackId: string]:ERC721NFT[] } => {
  throw new Error('not yet implemented');
  return {};
}

const createTracks =  async (newTrackIds:string[], trackMapping: { [trackId: string]:ERC721NFT[] }, clients: Clients):
Promise<{
  newTracks: ProcessedTrack[],
  joins: NFTTrackJoin[],
  errorNFTs: NFTProcessError[]
  artistProfiles: ArtistProfile[]
}> => {
  throw new Error('not yet implemented');
  return {} as any;
}


export default {
  //   addPlatformTrackData,
  //   mapTrack,
  //   mapArtistProfile,
  mapNFTsToTrackIds,
  createTracks
}
