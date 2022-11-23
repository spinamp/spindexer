import { ChainId } from './chain';

export type Block = {
  blockNumber: string;
  chainId: ChainId;
  timestamp: Date;
}