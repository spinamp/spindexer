import { EthClient } from "../clients/ethereum";
import { SubgraphClient } from "../clients/subgraph";
import { DBClient } from "../db/db";
import { Cursor, Trigger } from "./trigger";

export type Clients = {
  eth: EthClient,
  db: DBClient,
  subgraph: SubgraphClient,
}

export type Processor = {
  name: string,
  trigger: Trigger<Clients, Cursor | undefined>,
  processorFunction: (newTriggerItems: any[], clients: Clients) => Promise<void>;
  initialCursor: Cursor | undefined;
};
