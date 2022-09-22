import _ from 'lodash'

import { IdField } from './record';

export type Collector = IdField;
export type NFTsCollectors = {
  nftId: string
  collectorId: string
  amount: number
}
export type NFTsCollectorsChanges = NFTsCollectors;

export const consolidate = (changes: NFTsCollectorsChanges[]): NFTsCollectorsChanges[] => {
  const grouped = _.groupBy(changes, (e) => { return `${e.collectorId}-${e.nftId}` })
  const updates = _.mapValues(grouped, (v) => {
    return {
      nftId: v[0].nftId,
      collectorId: v[0].collectorId,
      amount: _.sumBy(v, (el) => { return el.amount } )
    }
  })
  return Object.values(updates)
}
