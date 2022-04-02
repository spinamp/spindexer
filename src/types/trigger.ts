import { SubgraphClient } from '../clients/subgraph';

export type Trigger = (subgraphClient: SubgraphClient, lastProcessedDBBlock: number) => Promise<any[]>;
