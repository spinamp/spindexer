
import { ethers } from 'ethers';

import { Table } from '../../db/db';
import { lensHandleChanged } from '../../triggers/newLensEvents';
import { formatAddress } from '../../types/address';
import { Identity } from '../../types/identity';
import { Clients, Processor } from '../../types/processor';

const NAME = 'newLensHandle'

const newLensHandle = (identities: Identity[]) => {
  const identitiesWithoutLensHandle = identities.filter(id => !id.lensHandle)

  return lensHandleChanged(identitiesWithoutLensHandle)
}


export const populateLensHandle: (identities: Identity[]) => Processor =
(identities) => ({
  name: NAME,
  trigger: newLensHandle(identities),
  processorFunction: async (triggerOutput , clients: Clients) => {

    console.log('got new events', triggerOutput.items.length)
    // const cursor = JSON.parse(triggerOutput.newCursor);

    const updatedItentites: Identity[] = triggerOutput.items.map((event: ethers.Event) => {
      const address = formatAddress(event.args!.to!)
      return {
        address: address,
        lensHandle: event.args!.handle!
      }
    })

    await clients.db.update<Identity>(Table.identities, updatedItentites, 'address')
    await clients.db.updateProcessor(NAME, triggerOutput.newCursor)

    // const blocks = Object.values(cursor).map((b) => parseInt(b as any));
    // console.log('min block', Math.min(...blocks))
    // console.log('max block', Math.max(...blocks))
  },
})
