import _ from 'lodash';
import slugify from 'slugify';


import { extractHashFromURL } from '../../clients/ipfs';
import { formatAddress } from '../address';
import { ArtistProfile } from '../artist';
import { NFT, getTrait, NftFactory } from '../nft';
import { MapTrack } from '../processor';
import { ProcessedTrack } from '../track';

function getTrackNameFromArtist(artist: string): string {
  const trackByArtist: any = {
    'LOPHIILE FT. TYLER JAY': 'see thru',
    'CARRTOONS': 'Cahuenga',
    'ROMDERFUL': 'DO YOU WANT TO TAKE A FLIGHT?',
    'AUTUMN KEYS FT AYOTEMI': 'Same Old',
    'OSHI': 'family photos',
    'DECAP': 'Gates',
    'CHROMONICCI': `Cosmo’s Adventure`,
    'XANDER': 'Somebody Else',
    'CAPSHUN & CORDEROYBOI': 'FINE',
    'PAUL MOND': 'is you real'
  }

  const track = trackByArtist[artist.toUpperCase()];

  if (!track){
    throw `Can't map artist to track name`;
  }

  return track

}

function getAvatarFromArtist(artist: string): string {
  const avatarByArtist: any = {
    'LOPHIILE FT. TYLER JAY': 'https://web3-music-pipeline.mypinata.cloud/ipfs/Qmd67SNvAgfMVU5LgEQnm7HFUT6kZnQ2WXbxvwV2CFFpFd',
    'CARRTOONS': 'https://web3-music-pipeline.mypinata.cloud/ipfs/QmNjRGN1y3NtFEh5mK4JSc4ZVJBToJ1iSewsQWwQ6Xykcd',
    'ROMDERFUL': 'https://web3-music-pipeline.mypinata.cloud/ipfs/QmSvqUiYF86eKk3aRks7beuNo8ZPic9ysVJLwFCeQeDKLU',
    'AUTUMN KEYS FT AYOTEMI': 'https://web3-music-pipeline.mypinata.cloud/ipfs/QmUp18kpqfdNE1NFEqJahGjnTmCWTRuogNzLeKCU3fFGi7',
    'OSHI': 'https://web3-music-pipeline.mypinata.cloud/ipfs/QmYoALqomeG5U3aivGFt2JNSaDEfHEXtGUcAz6jZnjT7XE',
    'DECAP': 'https://web3-music-pipeline.mypinata.cloud/ipfs/QmNsndybDyRrRiK7pM7KiHZHZGimuhEiHLhz3LwgvkbDch',
    'CHROMONICCI': 'https://web3-music-pipeline.mypinata.cloud/ipfs/QmXzsc1FqMzWNtLt57CwGkkZUaa36yk5GZQzZMXnsswtuD',
    'XANDER': 'https://web3-music-pipeline.mypinata.cloud/ipfs/QmTWmhDVQjd9QxoL1ncMxxBNHTKkqnMZCPRXAmTfMAyoW9',
    'CAPSHUN & CORDEROYBOI': 'https://web3-music-pipeline.mypinata.cloud/ipfs/QmdXF2TLWhvSjPmQjsccGspyuUoLhwKjuE6xA4ASQehzrN',
    'PAUL MOND': 'https://web3-music-pipeline.mypinata.cloud/ipfs/QmQ9WnpT5WKJ1Jq5X6YzWkxQj16iUFpRCRKyMjKJaw8pmQ'
  }

  const track = avatarByArtist[artist.toUpperCase()];

  if (!track){
    throw `Can't map artist to avatar`;
  }

  return track

}

function getArtistId(artist: string){
  const idByArtist: any = {
    'OSHI': 'ethereum/0x4d18f8f2ae19f1e166c97793cceeb70680a2b6d2',
    'CAPSHUN & CORDEROYBOI': 'ethereum/0xaa86ff6eb0ac77d46de48e955402cc3435c7ab8f',
  }

  const id = idByArtist[artist.toUpperCase()];

  if (id){
    return id
  }

  return artist

}

const mapTrack: MapTrack = (
  nft: NFT,
  apiTrack: any,
  contract?: NftFactory,
  trackId?: string,
): ProcessedTrack => {
  if (!contract) {
    throw new Error(`Contract missing for mapTrack for nft ${nft.id}`)
  }

  const artist = getTrait(nft, 'Artist');

  const track: Partial<ProcessedTrack> = {
    id: mapNFTtoTrackID(nft),
    platformInternalId: mapNFTtoTrackID(nft),
    title: getTrackNameFromArtist(artist),
    description: nft.metadata.description,
    platformId: contract.platformId,
    lossyAudioIPFSHash: extractHashFromURL(nft.metadata.animation_url),
    lossyArtworkIPFSHash: extractHashFromURL(nft.metadata.image),
    websiteUrl: nft.metadata.external_url,
    artistId: mapArtistProfile({ apiTrack: apiTrack, nft: nft, contract: contract }).artistId,
    createdAtTime: nft.createdAtTime,
    createdAtEthereumBlockNumber: nft.createdAtEthereumBlockNumber,
  };

  track.slug = slugify(`${track.title} ${nft.createdAtTime.getTime()}`).toLowerCase();

  return track as ProcessedTrack;
};

const mapArtistProfile = ({ apiTrack, nft, contract }: { apiTrack: any, nft?: NFT, contract?: NftFactory }): ArtistProfile => {
  if (!nft) {
    throw new Error(`NFT missing for mapArtistProfile for nft`)
  }
  if (!contract) {
    throw new Error(`Contract missing for mapArtistProfile for nft ${nft.id}`)
  }

  const artist = getTrait(nft, 'Artist');

  return {
    name: artist,
    artistId: getArtistId(artist),
    platformInternalId: artist,
    platformId: contract.platformId,
    avatarUrl: getAvatarFromArtist(artist),
    websiteUrl: nft.metadata.external_url,
    createdAtTime: nft.createdAtTime,
    createdAtEthereumBlockNumber: nft.createdAtEthereumBlockNumber,
  }
};

const mapNFTtoTrackID = (nft: NFT): string => {
  const artist = getTrait(nft, 'Artist');
  return `ethereum/${formatAddress(nft.contractAddress)}/${artist}`;
};

const mapNFTsToTrackIds = async (nfts: NFT[]): Promise<{ [trackId: string]: NFT[] }> => {
  return _.groupBy(nfts, nft => mapNFTtoTrackID(nft));
}

export default {
  mapNFTsToTrackIds,
  mapTrack,
  mapArtistProfile
}
