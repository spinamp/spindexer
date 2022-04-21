import { ERC721Contract } from '../types/ethereum';
import { Clients } from '../types/processor';
import { Trigger } from '../types/trigger';

const NUMBER_OF_CONFIRMATIONS = BigInt(12);
const MINIMUM_BLOCK_BATCH = BigInt(50);

export const newERC721Transfers: (contract: ERC721Contract) => Trigger<Clients, string> =
  (contract: ERC721Contract) => async (clients: Clients, cursor: string) => {
    const rangeStart = BigInt(cursor) + BigInt(1);
    let rangeEnd = BigInt(cursor) + BigInt(process.env.ETHEREUM_BLOCK_QUERY_GAP!);
    const latestEthereumBlock = BigInt(await clients.eth.getLatestBlockNumber());

    // Wait for confirmations
    if (rangeEnd > latestEthereumBlock - NUMBER_OF_CONFIRMATIONS) {
      rangeEnd = latestEthereumBlock - NUMBER_OF_CONFIRMATIONS
    }
    if (rangeStart > rangeEnd) {
      return [];
    }

    // Wait for minimum batch of blocks to process
    if (rangeEnd - rangeStart < MINIMUM_BLOCK_BATCH) {
      return [];
    }

    const newEvents = await clients.eth.getERC721TransferEventsFrom(rangeStart.toString(), rangeEnd.toString(), contract.address);
    return {
      items: newEvents,
      newCursor: rangeEnd.toString()
    };
  };
