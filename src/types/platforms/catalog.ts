import { toUtf8Bytes, verifyMessage } from 'ethers/lib/utils';
import _ from 'lodash';
import slugify from 'slugify';

import { CatalogClient } from '../../clients/catalog';
import { formatAddress } from '../address';
import { ArtistProfile } from '../artist';
import { ERC721NFT } from '../erc721nft';
import { MusicPlatform } from '../platform';
import { Clients } from '../processor';
import { NFTProcessError, NFTTrackJoin, ProcessedTrack } from '../track';

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

const mapNFTtoTrackID = (nft: ERC721NFT): string => {
  const [contractAddress, nftId] = nft.id.split('/');
  return `ethereum/${formatAddress(contractAddress)}/${nftId}`;
}


const mapAPITrackToArtistID = (apiTrack: any): string => {
  return `ethereum/${formatAddress(apiTrack.artist.id)}`;
};

const mapTrack = (nft: ERC721NFT, apiTrack: any): ProcessedTrack => ({
  id: apiTrack.trackId,
  platformInternalId: apiTrack.id,
  title: apiTrack.title,
  slug: slugify(`${apiTrack.title} ${nft.createdAtTime.getTime()}`).toLowerCase(),
  description: apiTrack.description,
  platformId: MusicPlatform.catalog,
  lossyAudioIPFSHash: apiTrack.ipfs_hash_lossy_audio,
  lossyAudioURL: `https://catalogworks.b-cdn.net/ipfs/${apiTrack.ipfs_hash_lossy_audio}`,
  createdAtTime: nft.createdAtTime,
  createdAtEthereumBlockNumber: nft.createdAtEthereumBlockNumber,
  lossyArtworkIPFSHash: apiTrack.ipfs_hash_lossy_artwork,
  lossyArtworkURL: `https://catalogworks.b-cdn.net/ipfs/${apiTrack.ipfs_hash_lossy_artwork}`,
  websiteUrl:
  apiTrack.artist.handle && apiTrack.short_url
      ? `https://beta.catalog.works/${apiTrack.artist.handle}/${apiTrack.short_url}`
      : 'https://beta.catalog.works',
  artistId: mapAPITrackToArtistID(apiTrack),
});

export const mapArtistProfile = (apiTrack: any, createdAtTime: Date, createdAtEthereumBlockNumber?: string): ArtistProfile => {
  const artist = apiTrack.artist;
  return {
    name: artist.name,
    artistId: mapAPITrackToArtistID(apiTrack),
    platformInternalId: artist.id,
    platformId: MusicPlatform.catalog,
    avatarUrl: artist.picture_uri,
    websiteUrl: artist.handle
      ? `https://beta.catalog.works/${artist.handle}`
      : 'https://beta.catalog.works',
    createdAtTime,
    createdAtEthereumBlockNumber
  }
};

const getAPITrackData = async (trackIds: string[], client: CatalogClient) => {
  const apiResponse = await client.fetchTracksByTrackId(trackIds);
  const apiTrackByTrackId = _.keyBy(apiResponse, 'trackId');
  return apiTrackByTrackId;
}

export const mapTrackIdToContractAddress = (id: string) => {
  return id.split('/')[0];
}

export const mapTrackIdToNFTId = (id: string) => {
  return id.split('/')[1];
}

const mapNFTsToTrackIds = (nfts:ERC721NFT[]):{ [trackId: string]:ERC721NFT[] } => {
  return _.groupBy(nfts, nft => mapNFTtoTrackID(nft));
}

const createTracks =  async (newTrackIds:string[], trackMapping: { [trackId: string]:ERC721NFT[] }, clients: Clients):
Promise<{
  newTracks: ProcessedTrack[],
  joins: NFTTrackJoin[],
  errorNFTs: NFTProcessError[]
  artistProfiles: ArtistProfile[]
}> => {
  if(newTrackIds.length === 0) {
    return {
      newTracks: [],
      joins: [],
      errorNFTs: [],
      artistProfiles: []
    }
  }
  const apiTrackData = await getAPITrackData(newTrackIds, clients.catalog);

  const newTracks:ProcessedTrack[] = [];
  const joins:NFTTrackJoin[] = [];
  const errorNFTs:NFTProcessError[] = [];
  const artistProfiles:ArtistProfile[] = [];

  newTrackIds.forEach(trackId => {
    const trackNFTs = trackMapping[trackId];
    const apiTrack = apiTrackData[trackId];
    if(!apiTrack) {
      trackNFTs.forEach(nft => {
        errorNFTs.push({
          erc721nftId: nft.id,
          processError: `Missing api track`
        });
      })
      return undefined;
    }

    newTracks.push(mapTrack(trackNFTs[0], apiTrack));
    trackNFTs.forEach(nft => {
      joins.push({
        erc721nftId: nft.id,
        processedTrackId: trackId
      });
    })

    const artistProfile = {
      ...mapArtistProfile(apiTrack, trackNFTs[0].createdAtTime, trackNFTs[0].createdAtEthereumBlockNumber),
    } as ArtistProfile;
    artistProfiles.push(artistProfile);
  });

  const uniqueArtistProfiles = _.uniqBy(artistProfiles, 'artistId');

  return { newTracks, joins, errorNFTs, artistProfiles: uniqueArtistProfiles };}


export default {
  //   addPlatformTrackData,
  //   mapTrack,
  //   mapArtistProfile,
  mapNFTsToTrackIds,
  createTracks
}
