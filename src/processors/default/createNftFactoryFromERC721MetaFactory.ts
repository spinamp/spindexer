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
    const eventToNftFactory = metaFactoryContractType?.creationEventToNftFactory;

    if (!eventToNftFactory) {
      throw `no eventToNftFactory specified for ${metaFactoryContractTypeName}`
    }

    const newNftFactoryObjects = events.map(e => eventToNftFactory(e, metaFactory.autoApprove, metaFactory.autoApprove));
    await clients.db.insert(Table.nftFactories, newNftFactoryObjects);
    await clients.db.updateProcessor(name, newCursor);

  };

export const createNftFactoryFromERC721MetaFactoryProcessor: (factoryContract: MetaFactory) =>
Processor = (factoryContract: MetaFactory) => ({
  name: `${NAME}_${factoryContract.address}`,
  trigger: newERC721Contract(factoryContract),
  processorFunction: processorFunction(factoryContract, `${NAME}_${factoryContract.address}`),
  initialCursor: JSON.stringify({ [factoryContract.address]: factoryContract.startingBlock }),
});
