import { MetaFactoryType } from '../metaFactory';
import { NftFactory } from '../nft';

const type: MetaFactoryType = {
  newContractCreatedEvent: 'CollectNFTDeployed',
  metadataAPI: async (events, clients) => {
      
    console.log('got events', events)

    if (!1){
      throw 'get metadata....'
    }

    return {}
  },
  creationMetadataToNftFactory(creationData, autoApprove, metaFactory, factoryMetadata?) {
      
    if (1){
      throw 'test create nft factory'
    }

    return {} as NftFactory;

  },
}

export default type;
