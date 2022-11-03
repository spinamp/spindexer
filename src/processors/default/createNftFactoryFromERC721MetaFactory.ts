import { ethers } from 'ethers';

import { Table } from '../../db/db';
import { newERC721Contract } from '../../triggers/newNFTContractEvent';
import { MetaFactory, MetaFactoryTypes } from '../../types/metaFactory';
import { Clients, Processor } from '../../types/processor';
import { Cursor } from '../../types/trigger';

const NAME = 'createNftFactoryFromERC721MetaFactoryProcessor';

const processorFunction = (metaFactory: MetaFactory, name: string) =>
  async ({ newCursor, items: events }: { newCursor: Cursor, items: ethers.Event[] }, clients: Clients) => {
    const metaFactoryContractTypeName = metaFactory.contractType;
    const metaFactoryContractType = MetaFactoryTypes[metaFactoryContractTypeName];
    if (!metaFactoryContractType) {
      throw new Error(`Unexpected metaFactoryContractType: ${metaFactoryContractTypeName}`)
    }
    let factoryMetadata: unknown;
    if (metaFactoryContractType.metadataAPI) {
      factoryMetadata = await metaFactoryContractType.metadataAPI(events, clients);
    }
    const eventToNftFactory = metaFactoryContractType.creationMetadataToNftFactory;

    if (!eventToNftFactory) {
      throw `no creationMetadataToNftFactory specified for ${metaFactoryContractTypeName}`
    }

    const newNftFactoryObjects = events.map(e => eventToNftFactory(e, metaFactory.autoApprove, metaFactory, factoryMetadata));

    await clients.db.insert(Table.nftFactories, newNftFactoryObjects);
    await clients.db.updateProcessor(name, newCursor);
  };

export const createNftFactoryFromERC721MetaFactoryProcessor: (factoryContract: MetaFactory) =>
Processor = (factoryContract: MetaFactory) => ({
  name: `${NAME}_${factoryContract.id}`,
  trigger: newERC721Contract(factoryContract),
  processorFunction: processorFunction(factoryContract, `${NAME}_${factoryContract.id}`),
  initialCursor: JSON.stringify({ [factoryContract.id]: factoryContract.startingBlock }),
});
