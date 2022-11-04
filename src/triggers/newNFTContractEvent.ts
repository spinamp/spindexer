import _ from 'lodash';

import { ContractFilter } from '../clients/evm';
import { ChainId } from '../types/chain';
import { EVMContract } from '../types/contract';
import { MetaFactory, MetaFactoryTypes } from '../types/metaFactory';
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
  if (sortedBlocks.length > 1) {
    rangeEnd = min(rangeEnd, sortedBlocks[1]);
  }

  return { rangeStart, rangeEnd, mostStaleContracts };
}

type ContractsEventsCursor = {
  [contractAddress: string]: string
};

export const newEVMEvents: (chainId: ChainId, contracts: EVMContract[], contractFilters: ContractFilter[], gap?: string) => Trigger<Cursor> =
  (chainId: ChainId, contracts: EVMContract[], contractFilters: ContractFilter[], gap: string = process.env.ETHEREUM_BLOCK_QUERY_GAP!) => {
    const triggerFunc = async (clients: Clients, cursorJSON = '{}'): Promise<TriggerOutput> => {

      const client = clients.evmChain[chainId];

      const cursor: ContractsEventsCursor = JSON.parse(cursorJSON) || {};
      if (contracts.length === 0) {
        return [];
      }
      contracts.forEach(contract => {
        if (!contract.startingBlock) {
          throw new Error(`Contract ${contract.id} has no starting block`);
        }

        if (!cursor[contract.id] && contract.startingBlock) {
          cursor[contract.id] = contract.startingBlock;
        }
      });
      // not all vars are const
      // eslint-disable-next-line prefer-const
      let { rangeStart, rangeEnd, mostStaleContracts } = calculateRange(cursor, gap);
      // Check for confirmations
      const latestEthereumBlock = BigInt(await client.getLatestBlockNumber());
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
      
      if (staleContractFilters.length === 0){
        return []
      }
      const newEvents = await client.getEventsFrom(rangeStart.toString(), rangeEnd.toString(), staleContractFilters);
      const newCursor = JSON.stringify(newCursorObject);
      if (newEvents.length === 0 && mostStaleContracts.length !== contracts.length) {
        console.log(`No new events found across contracts, recursing trigger with new cursor from block ${rangeEnd.toString()}`);
        return triggerFunc(clients, newCursor);
      }
      return {
        items: newEvents,
        newCursor
      };
    }
    return triggerFunc;
  };


export const newERC721Transfers: (chainId: ChainId, contracts: EVMContract[], gap?: string) => Trigger<Cursor> =
  (chainId: ChainId, contracts: EVMContract[], gap?: string) => {
    const contractFilters = contracts.map(contract => ({
      address: contract.id,
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
      }],
      [{
        address: factoryContract.id,
        filter: newContractCreatedEvent
      }],
      factoryContract.gap ? factoryContract.gap : undefined
    );
  };
