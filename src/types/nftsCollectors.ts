import _ from 'lodash'

import { IdField } from './record';

export type Collector = IdField;
export type NFTsCollectors = {
  nftId: string
  collectorId: string
  amount: number
}

// process all NftsCollectors amounts into a consolidated list
export const consolidate = (allNftsCollectors: NFTsCollectors[]): NFTsCollectors[] => {
  const grouped = _.groupBy(allNftsCollectors, (e) => { return `${e.collectorId}-${e.nftId}` })
  const consolidatedGroups = _.mapValues(grouped, (v) => {
    return {
      nftId: v[0].nftId,
      collectorId: v[0].collectorId,
      amount: _.sumBy(v, (el) => { return el.amount } )
    }
  })
  return Object.values(consolidatedGroups)
}
