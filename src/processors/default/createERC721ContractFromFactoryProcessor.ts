import { ethers } from 'ethers';

import { Table } from '../../db/db';
import { newERC721Contract } from '../../triggers/newNFTContractEvent';
import { FactoryContract, FactoryContractTypes } from '../../types/ethereum';
import { Clients, Processor } from '../../types/processor';
import { Cursor } from '../../types/trigger';

const NAME = 'createERC721ContractFromFactoryProcessor';

const processorFunction = (factoryContract: FactoryContract, name: string) =>
  async ({ newCursor, items: events }: { newCursor: Cursor, items: ethers.Event[] }, clients: Clients) => {
    const factoryContractTypeName = factoryContract.contractType;
    const factoryContractType = FactoryContractTypes[factoryContractTypeName];
    const eventToNftFactory = factoryContractType?.creationEventToNftFactory;
    if (eventToNftFactory){
      const newERC721ContractObjects = events.map(e => eventToNftFactory(e));
      console.log({ newERC721ContractObjects })
      await clients.db.insert(Table.nftFactories, newERC721ContractObjects);
      await clients.db.updateProcessor(name, newCursor);
    } else {
      console.log('no eventToNftFactory specified')
    }
  };

export const createERC721ContractFromFactoryProcessor: (factoryContract: FactoryContract) =>
Processor = (factoryContract: FactoryContract) => ({
  name: `${NAME}_${factoryContract.address}`,
  trigger: newERC721Contract(factoryContract),
  processorFunction: processorFunction(factoryContract, `${NAME}_${factoryContract.address}`),
  initialCursor: JSON.stringify({ [factoryContract.address]: factoryContract.startingBlock }),
});
