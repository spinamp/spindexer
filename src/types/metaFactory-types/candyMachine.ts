import { Metadata, JsonMetadata } from '@metaplex-foundation/js';

import { IdExtractorTypes } from '../fieldExtractor';
import { MetaFactory, MetaFactoryType } from '../metaFactory';
import { NFTContractTypeName, NFTStandard } from '../nft';

const type: MetaFactoryType = {
  creationMetadataToNftFactory: ({ metadataAccount }: { metadataAccount: Metadata }, autoApprove: boolean, metaFactory: MetaFactory) => {
    return {
      id: metadataAccount.mintAddress.toBase58(),
      chainId: metaFactory.chainId,
      contractType: NFTContractTypeName.candyMachine,
      platformId: metaFactory.platformId,
      standard: NFTStandard.METAPLEX,
      name: metadataAccount.name,
      symbol: metadataAccount.symbol,
      autoApprove, 
      approved: autoApprove, 
      typeMetadata: {
        ...metaFactory.typeMetadata,
        overrides: {
          ...metaFactory.typeMetadata?.overrides,
          extractor: {
            id: {
              extractor: IdExtractorTypes.USE_METAFACTORY_AND_TITLE_EXTRACTOR,
              params: { 
                metaFactoryId: metaFactory.id,
              }
            },
            ...metaFactory.typeMetadata?.overrides.extractor,
          },
          artist: {
            artistId: candyMachineArtistId(metadataAccount),
            ...metaFactory.typeMetadata?.overrides.artist,
          }
        }
      }
    }
  }
}

function candyMachineArtistId(metadataAccount: Metadata<JsonMetadata<string>>): string {
  const artist = metadataAccount.creators.find(creator => creator.verified === true);
  
  if (!artist){
    throw `Can't find artist address for ${metadataAccount.address.toBase58()}`
  }
  
  return artist.address.toBase58();
}

export default type;
