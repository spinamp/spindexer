import { EthClient } from "../clients/ethereum";
import { DBClient } from "../db/db";
import { Trigger } from "./trigger";

export type Processor = {
  name: string,
  trigger: Trigger,
  processorFunction: (newTriggerItems: any[], ethClient: EthClient, dbClient: DBClient) => Promise<void>;
};
