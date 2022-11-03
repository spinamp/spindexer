import { formatAddress } from '../address';
import { MetaFactoryType } from '../metaFactory';
import { NFTContractTypeName, NFTStandard } from '../nft';

const metaFactoryType: MetaFactoryType = {
  newContractCreatedEvent: 'CreatedArtist',
  creationMetadataToNftFactory: (event: any, autoApprove: boolean, metaFactory) => ({
    id: formatAddress(event.args!.artistAddress),
    platformId: 'sound',
    startingBlock: event.blockNumber,
    contractType: NFTContractTypeName.default,
    standard: NFTStandard.ERC721,
    autoApprove,
    approved: autoApprove,
    chainId: metaFactory.chainId
  })
}

export default metaFactoryType