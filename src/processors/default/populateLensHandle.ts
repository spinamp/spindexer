

import { ethers } from 'ethers';

import { ContractFilter } from '../../clients/evm';
import { Table } from '../../db/db';
import { LENS_HUB } from '../../db/migrations/43-add-lens';
import { newEVMEvents } from '../../triggers/newEVMEvent';
import { formatAddress } from '../../types/address';
import { ChainId } from '../../types/chain';
import { Identity } from '../../types/identity';
import { Clients, Processor } from '../../types/processor';
import { Trigger } from '../../types/trigger';

const NAME = 'newLensHandle'

const trigger: Trigger<undefined> = async (clients, triggerCursor) => {

  const identitiesSql = `
    select *
    from ${Table.identities}
    where "lensHandle" is null
  `
  
  const result = await clients.db.rawSQL(identitiesSql);
  const identities: Identity[] = result.rows;
  
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

  const contractFilters: ContractFilter[] = identities.map(id => ({
    address: LENS_HUB.address,
    filter: 'ProfileCreated',
    filterArgs: [null, null, id.address]
  }));
  const cursorArgs = identities.map(id => ({
    id: id.address,
    address: id.address,
    startingBlock: LENS_HUB.startingBlock!
  }))
    
  const getEvents = newEVMEvents(ChainId.polygon, cursorArgs, contractFilters, undefined, staleFilter, updateCursor);
  const output = (await getEvents(clients, triggerCursor!)) as { items: ethers.Event[], newCursor: string };

  if (output.items.length === 0){
    return []
  }

  return output
} 


export const populateLensHandle: Processor =
{
  name: NAME,
  trigger,
  processorFunction: async ({ items, newCursor } , clients: Clients) => {

    const cursor = JSON.parse(newCursor);

    const updatedItentites: Identity[] = items.map((event: ethers.Event) => {
      const address = formatAddress(event.args!.to!)
      delete cursor[address]
      return {
        address: address,
        lensHandle: event.args!.handle!,
        lensProfileId: event.args!.profileId!.toString(),
        lensAvatar: event.args!.imageURI!
      }
    })

    await clients.db.update<Identity>(Table.identities, updatedItentites, 'address')
    await clients.db.updateProcessor(NAME, JSON.stringify(cursor))
  },
}
