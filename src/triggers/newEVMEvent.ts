import _ from 'lodash';

import { ContractFilter } from '../clients/evm';
import { ChainId } from '../types/chain';
import { Clients } from '../types/processor';
import { Trigger, Cursor, TriggerOutput } from '../types/trigger';

const NUMBER_OF_CONFIRMATIONS = BigInt(12);

const min = (a: bigint, b: bigint) => (a < b ? a : b);

// This calculates which range of blocks to query. We want to avoid redoing
// queries for contracts that are already up to date. We also want to avoid
// querying the same block range more than one. The below algorithm achieves
// This by finding the most stale contracts and catching them up until all contracts
// are in sync at the same block, after which we can query them all together.
const calculateRange = (cursor: ContractsEventsCursor, gap: string, limit: number) => {
  const contracts = Object.keys(cursor);
  const contractsByBlock = _.groupBy(contracts, contract => cursor[contract]);
  const blocks = Object.keys(contractsByBlock).map(b => BigInt(b));
  const sortedBlocks = blocks.sort();
  const mostStaleBlock = sortedBlocks[0];
  const mostStaleContracts = contractsByBlock[mostStaleBlock.toString()].slice(0, limit);
  const rangeStart: bigint = mostStaleBlock + BigInt(1);

  let rangeEnd: bigint = rangeStart + BigInt(gap);
  if (sortedBlocks.length > 1) {
    rangeEnd = min(rangeEnd, sortedBlocks[1]);
  }

  return { rangeStart, rangeEnd, mostStaleContracts };
};

type ContractsEventsCursor = {
  [contractAddress: string]: string;
};

export type EVMEventCursorArgs = {
  id: string;
  address: string;
  startingBlock: string;
};

export const newEVMEvents: (
  chainId: ChainId,
  args: EVMEventCursorArgs[],
  contractFilters: ContractFilter[],
  gap?: string,
  staleFilter?: (contractFilters: ContractFilter[], staleArgIds: string[]) => ContractFilter[],
  updateCursor?: (rangeEnd: string, staleContractFilters: ContractFilter[]) => { [x: string]: string },
  limit?: number
) => Trigger<Cursor> = (
  chainId: ChainId,
  args: EVMEventCursorArgs[],
  contractFilters: ContractFilter[],
  gap: string = process.env.ETHEREUM_BLOCK_QUERY_GAP!,
  staleFilter,
  updateCursor,
  limit = 10
) => {
  const triggerFunc = async (
    clients: Clients,
    cursorJSON = '{}',
  ): Promise<TriggerOutput> => {
    const client = clients.evmChain[chainId];

    const cursor: ContractsEventsCursor = JSON.parse(cursorJSON) || {};
    if (args.length === 0) {
      return [];
    }
    args.forEach(arg => {
      if (!arg.startingBlock) {
        throw new Error(`Contract ${arg.id} has no starting block`);
      }

      if (!cursor[arg.address] && arg.startingBlock) {
        cursor[arg.address] = arg.startingBlock;
      }
    });
    // not all vars are const
    // eslint-disable-next-line prefer-const
    let { rangeStart, rangeEnd, mostStaleContracts } = calculateRange(
      cursor,
      gap,
      limit
    );
    // Check for confirmations
    const latestBlock = BigInt(await client.getLatestBlockNumber());
    if (rangeEnd > latestBlock - NUMBER_OF_CONFIRMATIONS) {
      rangeEnd = latestBlock - NUMBER_OF_CONFIRMATIONS;
    }

    if (rangeStart > rangeEnd) {
      return [];
    }

    // TODO: the filters don't have to include the stale cursor items!!
    let staleContractFilters;
    if (staleFilter){
      staleContractFilters = staleFilter(contractFilters, mostStaleContracts)
    } else {
      staleContractFilters = contractFilters.filter(filter => {
        return mostStaleContracts.includes(filter.address);
      });
    }
    let newCursorObject = { ...cursor };
    if (updateCursor){
      const updatedCursor = updateCursor(rangeEnd.toString(), staleContractFilters);
      newCursorObject = {
        ...newCursorObject,
        ...updatedCursor
      }
    } else {
      staleContractFilters.forEach(filter => {
        newCursorObject[filter.address] = rangeEnd.toString();
      });
    }

    if (staleContractFilters.length === 0) {
      return [];
    }

    const newEvents = await client.getEventsFrom(
      rangeStart.toString(),
      rangeEnd.toString(),
      staleContractFilters,
    );
    const newCursor = JSON.stringify(newCursorObject);
    if (newEvents.length === 0 && mostStaleContracts.length !== args.length) {
      console.log(
        `No new events found across contracts, recursing trigger with new cursor from block ${rangeEnd.toString()}`,
      );
      return triggerFunc(clients, newCursor);
    }
    return {
      items: newEvents,
      newCursor,
    };
  };
  return triggerFunc;
};
