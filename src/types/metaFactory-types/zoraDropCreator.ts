import { artistId } from '../../utils/identifiers';
import { formatAddress } from '../address';
import { getFactoryId } from '../chain';
import { MetaFactoryType } from '../metaFactory';
import { NFTContractTypeName, NFTStandard } from '../nft';

const type: MetaFactoryType = {
  newContractCreatedEvent: 'CreatedDrop',
  creationMetadataToNftFactory: (event: any, autoApprove: boolean, metaFactory) => ({
    id: getFactoryId(metaFactory.chainId, event.args!.editionContractAddress),
    address: formatAddress(event.args!.editionContractAddress),
    platformId: 'zora',
    chainId: metaFactory.chainId,
    startingBlock: event.blockNumber,
    contractType: NFTContractTypeName.default,
    standard: NFTStandard.ERC721,
    autoApprove,
    approved: autoApprove,
    typeMetadata: {
      overrides: {
        artist: {
          artistId: artistId(metaFactory.chainId, event.args!.creator),
          name: formatAddress(event.args!.creator),
        },
        track: {
          websiteUrl: `https://create.zora.co/editions/${formatAddress(event.args!.editionContractAddress)}`
        }
      }
    }
  })
}

export default type;
