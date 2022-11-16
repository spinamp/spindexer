
import { ethers } from 'ethers';

import { ContractFilter } from '../../clients/evm';
import { Table } from '../../db/db';
import { LENS_HUB } from '../../db/migrations/43-add-lens';
import { newEVMEvents } from '../../triggers/newEVMEvent';
import { ChainId } from '../../types/chain';
import { Identity } from '../../types/identity';
import { Clients, Processor } from '../../types/processor';
import { Trigger } from '../../types/trigger';

const NAME = 'newLensAvatar'

const trigger: Trigger<undefined> = async (clients, triggerCursor) => {

  const identitiesSql = `
    select *
    from ${Table.identities}
    where "lensProfileId" is not null
  `

  const result = await clients.db.rawSQL(identitiesSql);
  const identities: Identity[] = result.rows;

  const staleFilter = (filters: ContractFilter[], staleArgIds: string[]) => {
    return filters.filter(filter => staleArgIds.includes(filter.filterArgs![0]));
  }

  const updateCursor = (rangeEnd: string, staleContractFilters: ContractFilter[]) => {
    const cursor: { [x: string]: string } = {};

    for (const filter of staleContractFilters){
      cursor[filter.filterArgs![0]!] = rangeEnd;
    }

    return cursor;
  }

  const contractFilters: ContractFilter[] = identities.map(id => ({
    address: LENS_HUB.address,
    filter: 'ProfileImageURISet',
    filterArgs: [id.lensProfileId]
  }));
  const cursorArgs = identities.map(id => ({
    id: id.lensProfileId!,
    address: id.lensProfileId!,
    startingBlock: LENS_HUB.startingBlock!
  }))
    
  const getEvents = newEVMEvents(ChainId.polygon, cursorArgs, contractFilters, undefined, staleFilter, updateCursor);
  const output = (await getEvents(clients, triggerCursor!)) as { items: ethers.Event[], newCursor: string };
  if (output.items.length === 0){
    return []
  }

  return output
} 


export const populateLensAvatar: Processor =
{
  name: NAME,
  trigger,
  processorFunction: async (triggerOutput , clients: Clients) => {
    const updatedItentites: Identity[] = triggerOutput.items.map((event: ethers.Event) => {
      return {
        lensProfileId: event.args!.profileId!.toString(),
        lensAvatar: event.args!.imageURI!
      }
    })

    await clients.db.update<Identity>(Table.identities, updatedItentites, 'lensProfileId')
    await clients.db.updateProcessor(NAME, triggerOutput.newCursor)
  },
}
