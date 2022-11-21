import { ethers } from 'ethers';
import _ from 'lodash';

import { artistId } from '../../utils/identifiers';
import { formatAddress } from '../address';
import { getFactoryId } from '../chain';
import { ArtistIdExtractorTypes, ArtistNameExtractorTypes, AudioUrlExtractorTypes, IdExtractorTypes, TitleExtractorTypes } from '../fieldExtractor';
import { MetaFactoryType } from '../metaFactory';
import { NFTContractTypeName } from '../nft';

const type: MetaFactoryType = {
  newContractCreatedEvent: 'CollectNFTDeployed',
  metadataAPI: async (events, clients, metaFactory) => {
    if (events.length === 0){
      return {}
    }

    const maxEventBlockNumber = events.reduce((maxBlock, event) => Math.max(maxBlock, event.blockNumber), 0)

    const profileCreatedEvents = await clients.evmChain[metaFactory.chainId]
      .getEventsFrom(
        metaFactory.startingBlock!,
        maxEventBlockNumber.toString(),
        events.map(event => {
          const profileId = ethers.BigNumber.from(event.args!.profileId).toNumber();
          return {
            address: metaFactory.address,
            filter: `ProfileCreated`,
            filterArgs: [profileId]
          }
        }))

    const profileCreatedEventByProfileId = _.keyBy(
      profileCreatedEvents,
      event => event.args!.profileId!.toNumber()
    )

    const profilesByCollectNft = _.keyBy(
      events.map(event => {
        const profileId = ethers.BigNumber.from(event.args!.profileId).toNumber()
        const profileCreatedEvent = profileCreatedEventByProfileId[profileId] as any;
        
        return {
          collectNFT: event.args!.collectNFT,
          profile: {
            handle: profileCreatedEvent.args.handle,
            ownedBy: profileCreatedEvent.args.to,
            id: profileId,
          }
        }
      }),
      'collectNFT',
    )

    return profilesByCollectNft

  },
  creationMetadataToNftFactory(
    event,
    autoApprove,
    metaFactory,
    factoryMetadata: { 
      [collectNFT: string]: { 
        profile: { 
          handle: string;
          ownedBy: string;
          id: string;
        } 
      } 
    })
  {
    const apiMetadata = factoryMetadata[event.args!.collectNFT];

    return {
      id: getFactoryId(metaFactory.chainId, event.args.collectNFT),
      address: formatAddress(event.args.collectNFT),
      approved: autoApprove,
      autoApprove: autoApprove,
      chainId: metaFactory.chainId,
      contractType: NFTContractTypeName.default,
      platformId: metaFactory.platformId,
      standard: metaFactory.standard,
      startingBlock: `${parseInt(event.blockNumber) - 1}`,
      typeMetadata: {
        overrides: {
          extractor: {
            id: IdExtractorTypes.USE_TITLE_EXTRACTOR,
            title: TitleExtractorTypes.METADATA_NAME,
            artistName: ArtistNameExtractorTypes.USE_ARTIST_NAME_OVERRIDE,
            artistId: ArtistIdExtractorTypes.USE_ARTIST_ID_OVERRIDE,
            audioUrl: AudioUrlExtractorTypes.FIND_AUDIO_MEDIA
          },
          artist: {
            name: apiMetadata.profile.handle,
            artistId: artistId(metaFactory.chainId,apiMetadata.profile.ownedBy),
            websiteUrl: `https://lenster.xyz/u/${apiMetadata.profile.handle}`
          },
          track: {
            websiteUrl: `https://lenster.xyz/posts/${event.args!.profileId.toHexString()}-${event.args!.pubId.toHexString()}`
          }
        }
      }
    }
  },
}

export default type;
