
import { ChainId } from '../types/chain';
import { EVMContract } from '../types/contract';
import { MetaFactory, MetaFactoryTypes } from '../types/metaFactory';
import { Cursor, Trigger } from '../types/trigger';

import { newEVMEvents } from './newEVMEvent';

export const newERC721Transfers: (chainId: ChainId, contracts: EVMContract[], gap?: string) => Trigger<Cursor> =
  (chainId: ChainId, contracts: EVMContract[], gap?: string) => {
    const contractFilters = contracts.map(contract => ({
      address: contract.address,
      filter: 'Transfer'
    }));
    return newEVMEvents(chainId, contracts, contractFilters, gap);
  };

export const newERC721Contract: (factoryContract: MetaFactory) => Trigger<Cursor> =
  (factoryContract: MetaFactory) => {
    const factoryContractTypeName = factoryContract.contractType;
    const newContractCreatedEvent = MetaFactoryTypes[factoryContractTypeName]?.newContractCreatedEvent;

    if (!newContractCreatedEvent){
      throw 'no newContractCreatedEvent specified'
    }

    return newEVMEvents(
      factoryContract.chainId,
      [{
        id: factoryContract.id,
        startingBlock: factoryContract.startingBlock!,
        address: factoryContract.address
      }],
      [{
        address: factoryContract.address,
        filter: newContractCreatedEvent
      }],
      factoryContract.gap ? factoryContract.gap : undefined
    );
  };
