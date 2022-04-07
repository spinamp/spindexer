import { Axios } from "axios";
import { CatalogClient } from "../clients/catalog";
import { EthClient } from "../clients/ethereum";
import { IPFSClient } from "../clients/ipfs";
import { SoundClient } from "../clients/sound";
import { NOIZDClient } from "../clients/noizd";
import { SubgraphClient } from "../clients/subgraph";
import { DBClient } from "../db/db";
import { Cursor, Trigger } from "./trigger";

export type PlatformClient = {};

export type Clients = {
  eth: EthClient,
  db: DBClient,
  subgraph: SubgraphClient,
  axios: Axios,
  ipfs: IPFSClient,
  catalog: CatalogClient,
  sound: SoundClient,
  noizd: NOIZDClient
}

export type Processor = {
  name: string,
  trigger: Trigger<Clients, Cursor | undefined>,
  processorFunction: (newTriggerItems: any[], clients: Clients) => Promise<void>;
  initialCursor: Cursor | undefined;
};
