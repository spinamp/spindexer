import { IdExtractorTypes, TitleExtractorTypes, ArtistIdExtractorTypes, ArtistNameExtractorTypes } from '../fieldExtractor';
import { MetaFactoryType } from '../metaFactory';
import { NftFactory, NFTContractTypeName, NFTStandard } from '../nft';
import { Clients } from '../processor';

const type: MetaFactoryType = {
  newContractCreatedEvent: 'DeployDCNT721A',
  metadataAPI: async (events, clients: Clients) => {
    if (events.length === 0){
      return 
    }

    const results = await Promise.all(
      events.map(async event => {
        const contractAddress = event!.args!.DCNT721A;
        const owner = await clients.eth.getContractOwner(contractAddress)
        return {
          contract: contractAddress,
          owner
        }
      })
    )

    return results
  },
  creationMetadataToNftFactory(event, autoApprove, metaFactory, factoryMetadata: { contract: string, owner: string }[]) {
    const apiMetadata = factoryMetadata.find(data => data.contract === event.args.DCNT721A)

    if (!apiMetadata){
      throw `Couldn't find owner for contract`;
    }

    const nftFactory: NftFactory = {
      approved: autoApprove,
      chainId: metaFactory.chainId,
      autoApprove,
      contractType: NFTContractTypeName.default,
      id: event.args.DCNT721A,
      platformId: 'decent',
      standard: NFTStandard.ERC721,
      startingBlock: `${parseInt(event.blockNumber) - 1}`,
      typeMetadata: {
        overrides: {
          artist: {
            artistId: apiMetadata.owner
          },
          extractor: {
            id: IdExtractorTypes.USE_TITLE_EXTRACTOR,
            title: TitleExtractorTypes.METADATA_NAME,
            artistId: ArtistIdExtractorTypes.USE_ARTIST_ID_OVERRIDE,
            artistName: ArtistNameExtractorTypes.METADATA_ARTIST
          }
        }
      }
    } 

    return nftFactory
  },
}

export default type;
