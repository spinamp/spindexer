import { ethers } from 'ethers';
import { gql, GraphQLClient } from 'graphql-request';
import _ from 'lodash';

import { ArtistIdExtractorTypes, ArtistNameExtractorTypes, IdExtractorTypes, TitleExtractorTypes } from '../fieldExtractor';
import { MetaFactoryType } from '../metaFactory';
import { NFTContractTypeName } from '../nft';

const lensAPI = new GraphQLClient(process.env.LENS_API!);

const type: MetaFactoryType = {
  newContractCreatedEvent: 'CollectNFTDeployed',
  metadataAPI: async (events, clients, metaFactory) => {
    const profileIds = Array.from(new Set(events.map(event => ethers.BigNumber.from(event.args!.profileId).toHexString())));

    if (profileIds.length === 0){
      return {}
    }

    const chunks = _.chunk(profileIds, 50);

    const queries = chunks.map(chunk => {
      const query = gql`
      {
        profiles(request: { profileIds: ${JSON.stringify(chunk)}, limit: ${chunk.length} }) {
          items {
            handle
            ownedBy
            id
          }
        }
      }
      `
      return { document: query } ;
    })

    const result = await lensAPI.batchRequests(queries);

    const profiles = _.flatten(result.map((res: any) => res.data.profiles.items))
    const profilesById = _.keyBy(profiles, 'id')

    const profilesByCollectNft = _.keyBy(
      events.map(event => {
        const profileId = ethers.BigNumber.from(event.args!.profileId).toHexString()
        const profile = profilesById[profileId];
        
        return {
          collectNFT: event.args!.collectNFT,
          profile
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
      approved: autoApprove,
      autoApprove: autoApprove,
      chainId: metaFactory.chainId,
      contractType: NFTContractTypeName.default,
      id: event.args.collectNFT,
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
          },
          artist: {
            name: apiMetadata.profile.handle,
            artistId: apiMetadata.profile.ownedBy
          }
        }
      }
    }
  },
}

export default type;
