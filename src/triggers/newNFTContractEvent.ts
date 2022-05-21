import _, { range } from 'lodash';

import { ContractFilter, EthClient } from '../clients/ethereum';
import { ERC721Contract, EthereumContract, FactoryContract, FactoryContractTypes } from '../types/ethereum';
import { Clients } from '../types/processor';
import { Cursor, Trigger, TriggerOutput } from '../types/trigger';

const NUMBER_OF_CONFIRMATIONS = BigInt(12);

const min = (a: bigint, b: bigint) => a < b ? a : b;

// This calculates which range of blocks to query. We want to avoid redoing
// queries for contracts that are already up to date. We also want to avoid
// querying the same block range more than one. The below algorithm achieves
// This by finding the most stale contracts and catching them up until all contracts
// are in sync at the same block, after which we can query them all together.
const calculateRange = (cursor: ContractsEventsCursor, gap: string) => {
  const contracts = Object.keys(cursor);
  const contractsByBlock = _.groupBy(contracts, contract => cursor[contract]);
  const blocks = Object.keys(contractsByBlock).map((b) => BigInt(b));
  const sortedBlocks = blocks.sort();
  const mostStaleBlock = sortedBlocks[0];
  const mostStaleContracts = contractsByBlock[mostStaleBlock.toString()];
  const rangeStart: bigint = mostStaleBlock + BigInt(1);

  let rangeEnd: bigint = rangeStart + BigInt(gap);
  if (sortedBlocks.length > 1 ) {
    rangeEnd = min(rangeEnd, sortedBlocks[1]);
  }

  return { rangeStart, rangeEnd, mostStaleContracts };
}

type ContractsEventsCursor = {
  [contractAddress: string]: string
};

export const newEthereumEvents: (contracts: EthereumContract[], contractFilters: ContractFilter[], gap?: string) => Trigger<Cursor> =
  (contracts: EthereumContract[], contractFilters: ContractFilter[], gap: string = process.env.ETHEREUM_BLOCK_QUERY_GAP!) => {
    const triggerFunc = async (clients: Clients, cursorJSON = '{}'): Promise<TriggerOutput> => {
      const cursor: ContractsEventsCursor = JSON.parse(cursorJSON) || {};
      if (contracts.length === 0) {
        return [];
      }
      contracts.forEach(contract => {
        if (!cursor[contract.address]) {
          cursor[contract.address] = contract.startingBlock;
        }
      });
      let { rangeStart, rangeEnd, mostStaleContracts } = calculateRange(cursor, gap);

      // Check for confirmations
      const latestEthereumBlock = BigInt(await clients.eth.getLatestBlockNumber());
      if (rangeEnd > latestEthereumBlock - NUMBER_OF_CONFIRMATIONS) {
        rangeEnd = latestEthereumBlock - NUMBER_OF_CONFIRMATIONS
      }

      if (rangeStart > rangeEnd) {
        return [];
      }

      const staleContractFilters = contractFilters.filter(filter => {
        return mostStaleContracts.includes(filter.address);
      });
      const newCursorObject = { ...cursor };
      staleContractFilters.forEach(filter => {
        newCursorObject[filter.address] = rangeEnd.toString();
      });

      const newEvents = await clients.eth.getEventsFrom(rangeStart.toString(), rangeEnd.toString(), staleContractFilters);
      const newCursor = JSON.stringify(newCursorObject);
      if (newEvents.length === 0 && mostStaleContracts.length !== contracts.length) {
        console.log('Recursing trigger');
        return triggerFunc(clients, newCursor);
      }
      return {
        items: newEvents,
        newCursor
      };
    }
    return triggerFunc;
  };


export const newERC721Transfers: (contracts: ERC721Contract[]) => Trigger<Cursor> =
  (contracts: ERC721Contract[]) => {
    const contractFilters = contracts.map(contract => ({
      address: contract.address,
      filter: 'Transfer'
    }));
    return newEthereumEvents(contracts, contractFilters);
  };

export const newERC721Contract: (factoryContract: FactoryContract) => Trigger<Cursor> =
  (factoryContract: FactoryContract) => {
    const factoryContractTypeName = factoryContract.contractType;
    const newContractCreatedEvent = FactoryContractTypes[factoryContractTypeName].newContractCreatedEvent;

    return newEthereumEvents([factoryContract], [{
      address: factoryContract.address,
      filter: newContractCreatedEvent
    }], factoryContract.gap ? factoryContract.gap : undefined);
  };
