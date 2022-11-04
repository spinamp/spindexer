import { MetaFactoryType } from '../metaFactory';
import { NFTContractTypeName } from '../nft';

const type: MetaFactoryType = {
  newContractCreatedEvent: 'CollectNFTDeployed',
  creationMetadataToNftFactory(event, autoApprove, metaFactory, factoryMetadata?) {
    return {
      approved: autoApprove,
      autoApprove: autoApprove,
      chainId: metaFactory.chainId,
      contractType: NFTContractTypeName.default,
      id: event.args.collectNFT,
      platformId: metaFactory.platformId,
      standard: metaFactory.standard,
      startingBlock: `${parseInt(event.blockNumber) - 1}`,
    }
  },
}

export default type;
