import { DBClient, Table } from '../src/db/db';
import { Chain, ChainId, ChainType } from '../src/types/chain';

const ETHEREUM: Chain = {
  id: ChainId.ethereum,
  name: 'Ethereum',
  type: ChainType.evm,
  rpcUrlKey: 'ETHEREUM_PROVIDER_ENDPOINT'
}

const POLYGON: Chain = {
  id: ChainId.polygon,
  name: 'Polygon POS',
  type: ChainType.evm,
  rpcUrlKey: 'POLYGON_PROVIDER_ENDPOINT'
}

const SOLANA: Chain = {
  id: ChainId.solana,
  name: 'Solana',
  type: ChainType.solana,
  rpcUrlKey: 'SOLANA_PROVIDER_ENDPOINT'
}

export const truncateDB = async (dbClient: DBClient) => {
  const tablesToDrop = Object.values(Table).join(', ');
  await dbClient.rawSQL(`TRUNCATE TABLE ${tablesToDrop} CASCADE;`);
  await dbClient.insert(Table.chains, [ETHEREUM, POLYGON, SOLANA]);
}
