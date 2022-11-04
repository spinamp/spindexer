export enum ChainType {
  'evm' = 'evm',
  'solana' = 'solana'
}

export enum ChainId {
  'ethereum' = 'ethereum',
  'polygon' = 'polygon',
  'solana' = 'solana'
}

export type Chain = {
  id: ChainId;
  name: string;
  rpcUrl: string;
  type: ChainType
}