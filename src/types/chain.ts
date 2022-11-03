export enum ChainType {
  'evm',
  'solana'
}

export enum ChainId {
  'ethereum',
  'polygon',
  'solana'
}

export type Chain = {
  id: ChainId;
  name: string;
  rpcUrl: string;
  type: ChainType
}