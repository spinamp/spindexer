import { ContractFilter } from '../clients/ethereum';
import { ERC721Contract, FactoryContract, FactoryContractTypes } from '../types/ethereum';
import { Clients } from '../types/processor';
import { Trigger } from '../types/trigger';

const NUMBER_OF_CONFIRMATIONS = BigInt(12);
const MINIMUM_BLOCK_BATCH = BigInt(50);

export const newEthereumEvents: (contractFilters: ContractFilter[]) => Trigger<Clients, string> =
  (contractFilters: ContractFilter[]) => {
    return async (clients: Clients, cursor: string) => {
      const rangeStart = BigInt(cursor) + BigInt(1);
      const gap =  BigInt(process.env.ETHEREUM_BLOCK_QUERY_GAP!)
      let rangeEnd = BigInt(cursor) + gap;
      const latestEthereumBlock = BigInt(await clients.eth.getLatestBlockNumber());

      // Wait for confirmations
      if (rangeEnd > latestEthereumBlock - NUMBER_OF_CONFIRMATIONS) {
        rangeEnd = latestEthereumBlock - NUMBER_OF_CONFIRMATIONS
      }
      if (rangeStart > rangeEnd) {
        return [];
      }

      // Wait for minimum batch of blocks to process
      if (rangeEnd - rangeStart < MINIMUM_BLOCK_BATCH) {
        return [];
      }

      const newEvents = await clients.eth.getEventsFrom(rangeStart.toString(), rangeEnd.toString(), contractFilters);
      return {
        items: newEvents,
        newCursor: rangeEnd.toString()
      };
    }
  };

export const newERC721Transfers: (contract: ERC721Contract) => Trigger<Clients, string> =
  (contract: ERC721Contract) => newEthereumEvents([{
    address: contract.address,
    filter: 'Transfer'
  }]);

  export const newERC721Contracts: (factoryContract: FactoryContract) => Trigger<Clients, string> =
  (factoryContract: FactoryContract) => {
    const factoryContractTypeName = factoryContract.contractType;
    const newContractCreatedEvent = FactoryContractTypes[factoryContractTypeName].newContractCreatedEvent

    return newEthereumEvents([{
      address: factoryContract.address,
      filter: newContractCreatedEvent
    }]);
  };

  export const newEditionsCreated: (contract: ERC721Contract) => Trigger<Clients, string> =
  (contract: ERC721Contract) => newEthereumEvents([{
    address: contract.address,
    filter: 'EditionCreated'
  }]);


  export const newEditionsPurchased: (contract: ERC721Contract) => Trigger<Clients, string> =
  (contract: ERC721Contract) => newEthereumEvents([{
    address: contract.address,
    filter: 'EditionPurchased'
  }]);
