import { ContractFilter } from '../clients/evm';
import { LENS_HUB } from '../db/migrations/43-add-lens';
import { ChainId } from '../types/chain';
import { Identity } from '../types/identity';
import { Trigger, Cursor } from '../types/trigger';

import { newEVMEvents } from './newEVMEvent';

export const lensHandleChanged: (identities: Identity[]) => Trigger<Cursor> =
  (identities) => {
    const contractFilters: ContractFilter[] = identities.map(id => ({
      address: LENS_HUB.address, // LENS hub address
      filter: 'ProfileCreated',
      filterArgs: [null, null, id.address]
    }));
    const cursorArgs = identities.map(id => ({
      id: id.address,
      address: id.address,
      startingBlock: LENS_HUB.startingBlock!
    }))
    const staleFilter = (filters: ContractFilter[], staleArgIds: string[]) => {
      return filters.filter(filter => staleArgIds.includes(filter.filterArgs![2]));
    }

    const updateCursor = (rangeEnd: string, staleContractFilters: ContractFilter[]) => {
      const cursor: { [x: string]: string } = {};

      for (const filter of staleContractFilters){
        cursor[filter.filterArgs![2]!] = rangeEnd;
      }

      return cursor;
    }

    return newEVMEvents(ChainId.polygon, cursorArgs, contractFilters, undefined, staleFilter, updateCursor);
  };

