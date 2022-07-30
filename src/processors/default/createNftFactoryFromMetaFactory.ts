import { ethers } from 'ethers';

import { Table } from '../../db/db';
import { newERC721Contract } from '../../triggers/newNFTContractEvent';
import { MetaFactory, FactoryContractTypes } from '../../types/ethereum';
import { Clients, Processor } from '../../types/processor';
import { Cursor } from '../../types/trigger';

const NAME = 'createNftFactoryFromMetaFactoryProcessor';

const processorFunction = (factoryContract: MetaFactory, name: string) =>
  async ({ newCursor, items: events }: { newCursor: Cursor, items: ethers.Event[] }, clients: Clients) => {
    const factoryContractTypeName = factoryContract.contractType;
    const factoryContractType = FactoryContractTypes[factoryContractTypeName];
    const eventToNftFactory = factoryContractType?.creationEventToNftFactory;

    if (!eventToNftFactory) {
      throw `no eventToNftFactory specified for ${factoryContractTypeName}`
    }

    const newNftFactoryObjects = events.map(e => eventToNftFactory(e));
    console.log({ newNftFactoryObjects })
    await clients.db.insert(Table.nftFactories, newNftFactoryObjects);
    await clients.db.updateProcessor(name, newCursor);

  };

export const createNftFactoryFromMetaFactoryProcessor: (factoryContract: MetaFactory) =>
Processor = (factoryContract: MetaFactory) => ({
  name: `${NAME}_${factoryContract.address}`,
  trigger: newERC721Contract(factoryContract),
  processorFunction: processorFunction(factoryContract, `${NAME}_${factoryContract.address}`),
  initialCursor: JSON.stringify({ [factoryContract.address]: factoryContract.startingBlock }),
});
