import { ethers } from 'ethers';
import _ from 'lodash';

import { newERC721Contracts } from '../../triggers/newNFTContractEvent';
import { FactoryContract, FactoryContractTypes } from '../../types/ethereum';
import { Clients, Processor } from '../../types/processor';
import { Cursor } from '../../types/trigger';

const NAME = 'createERC721ContractFromFactoryProcessor';

const processorFunction = (factoryContract: FactoryContract, name: string) =>
  async ({ newCursor, items:events }: {newCursor: Cursor, items: ethers.Event[]}, clients: Clients) => {
    const factoryContractTypeName = factoryContract.contractType;
    const factoryContractType = FactoryContractTypes[factoryContractTypeName];
    const eventToERC721Contract = factoryContractType.creationEventToERC721Contract;
    const newERC721ContractObjects = events.map(e => eventToERC721Contract(e));
    await clients.db.insert('erc721Contracts', newERC721ContractObjects);
    await clients.db.updateProcessor(name, newCursor);
  };

export const createERC721ContractFromFactoryProcessor: (factoryContract: FactoryContract) =>
Processor = (factoryContract: FactoryContract) => ({
  name: `${NAME}_${factoryContract.address}`,
  trigger: newERC721Contracts(factoryContract),
  processorFunction: processorFunction(factoryContract, `${NAME}_${factoryContract.address}`),
  initialCursor: factoryContract.startingBlock,
});
