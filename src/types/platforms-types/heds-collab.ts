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
    'LOPHIILE FT. TYLER JAY': 'https://firebasestorage.googleapis.com/v0/b/heds-34ac0.appspot.com/o/tapes%2FcollabTAPES%2FGood%20Society%2FImages%2Fartists%2FLophiile.jpg?alt=media&token=538507ad-08d7-499d-a7af-f689377f3349',
    'CARRTOONS': 'https://firebasestorage.googleapis.com/v0/b/heds-34ac0.appspot.com/o/tapes%2FcollabTAPES%2FGood%20Society%2FImages%2Fartists%2Fcarrtoons.jpg?alt=media&token=e6e5311c-590c-4a6e-b82d-3b3cc2bda207',
    'ROMDERFUL': 'https://firebasestorage.googleapis.com/v0/b/heds-34ac0.appspot.com/o/tapes%2FcollabTAPES%2FGood%20Society%2FImages%2Fartists%2FROMDERFUL.jpg?alt=media&token=697ee0dc-a8ed-4a81-bc6b-ac31f9db22d0',
    'AUTUMN KEYS FT AYOTEMI': 'https://firebasestorage.googleapis.com/v0/b/heds-34ac0.appspot.com/o/tapes%2FcollabTAPES%2FGood%20Society%2FImages%2Fartists%2Fautumn%20keys.jpeg?alt=media&token=6cec0f08-839e-4427-b875-178a8ad5c788',
    'OSHI': 'https://firebasestorage.googleapis.com/v0/b/heds-34ac0.appspot.com/o/tapes%2FcollabTAPES%2FGood%20Society%2FImages%2Fartists%2Foshi.png?alt=media&token=c1282dae-5de3-44cd-91dc-d38c75ee4b07',
    'DECAP': 'https://firebasestorage.googleapis.com/v0/b/heds-34ac0.appspot.com/o/tapes%2FcollabTAPES%2FGood%20Society%2FImages%2Fartists%2Fdecap.jpg?alt=media&token=0788736c-6b9b-43c2-becd-be72b5578dbf',
    'CHROMONICCI': `https://firebasestorage.googleapis.com/v0/b/heds-34ac0.appspot.com/o/tapes%2FcollabTAPES%2FGood%20Society%2FImages%2Fartists%2Fchromonicci.jpg?alt=media&token=cd5f28eb-350a-4c7f-a353-bf3894759bc7`,
    'XANDER': 'https://firebasestorage.googleapis.com/v0/b/heds-34ac0.appspot.com/o/tapes%2FcollabTAPES%2FGood%20Society%2FImages%2Fartists%2Fxander.jpeg?alt=media&token=57173553-96db-49a4-b739-f7284161f48e',
    'CAPSHUN & CORDEROYBOI': 'https://firebasestorage.googleapis.com/v0/b/heds-34ac0.appspot.com/o/tapes%2FcollabTAPES%2FGood%20Society%2FImages%2Fartists%2Fcapshun-4.jpeg?alt=media&token=37b17134-0b3f-43f6-89d7-456ff5925a92',
    'PAUL MOND': 'https://firebasestorage.googleapis.com/v0/b/heds-34ac0.appspot.com/o/tapes%2FcollabTAPES%2FGood%20Society%2FImages%2Fartists%2Fpaulmond.jpg?alt=media&token=bdb72778-07a7-43c6-a4aa-580b5fa073b3'
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
