
import { ethers } from 'ethers';

import MetaABI from '../../abis/MetaABI.json';
import { getMetadataFromURI } from '../../processors/default/addMetadataObject';
import { artistId } from '../../utils/identifiers';
import { formatAddress } from '../address';
import { getFactoryId } from '../chain';
import { MetaFactoryType } from '../metaFactory';
import { NFTContractTypeName, NFTStandard } from '../nft';

type CreatedDropEventWithMetadata = {
  creator: string;
  address: string;
  artistName: string;
  contractURI: string;
  animationURL?: string;
  animationMimeType?: string;
}

const type: MetaFactoryType = {
  newContractCreatedEvent: 'CreatedDrop',
  metadataAPI: async (events, clients, metaFactory) => {
    if (events.length === 0){
      return {}
    }

    const eventMetadatas: CreatedDropEventWithMetadata[] = [];
    for (const event of events) {
      const creator = (event as any).args!.creator;
      const address = formatAddress((event as any).args!.editionContractAddress);
      const contract = new ethers.Contract(address, MetaABI.abi, clients.evmChain[metaFactory.chainId].provider);
      const creatorENS = await Promise.reject(); // todo - get ens from creator from ens PR;
      const artistName = creatorENS || formatAddress(event.args!.creator);
      const contractURI = await contract.contractURI();
      const metadataResponse = await getMetadataFromURI(contractURI, clients.axios, parseInt(process.env.METADATA_REQUEST_TIMEOUT!));
      let animationURL, animationMimeType;
      if (metadataResponse.data) {
        animationURL = metadataResponse.data.metadata.animationURL;
        animationMimeType = await Promise.reject(); // todo - use mime call from mimetype PR
      }
      eventMetadatas.push({
        creator, address, artistName, contractURI, animationURL, animationMimeType
      });
    }

    return eventMetadatas;
  },
  creationMetadataToNftFactory: (event: any, autoApprove: boolean, metaFactory,
    factoryMetadata: CreatedDropEventWithMetadata) => ({
    id: getFactoryId(metaFactory.chainId, factoryMetadata.address),
    address: factoryMetadata.address,
    platformId: 'zora',
    chainId: metaFactory.chainId,
    startingBlock: event.blockNumber,
    contractType: NFTContractTypeName.default,
    standard: NFTStandard.ERC721,
    autoApprove: isAudio(factoryMetadata.animationMimeType), //todo - use isAudio from mimetype PR
    approved: isAudio(factoryMetadata.animationMimeType), //todo - use isAudio from mimetype PR
    typeMetadata: {
      overrides: {
        artist: {
          artistId: artistId(metaFactory.chainId, event.args!.creator),
          name: factoryMetadata.artistName,
        },
        track: {
          websiteUrl: `https://create.zora.co/editions/${factoryMetadata.address}`
        }
      }
    }
  })
}

export default type;
