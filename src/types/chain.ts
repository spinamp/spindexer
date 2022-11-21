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
  rpcUrlKey: string;
  type: ChainType
}

export function getFactoryId(chainId: ChainId, factoryAddress: string): string {

  // don't prefix ethereum and solana ids to maintain backwards compatibility
  if (chainId === ChainId.ethereum || chainId === ChainId.solana){
    return factoryAddress;
  }

  // prefix other addresses from other chains with the chain ID to prevent collisions accross chains
  return `${chainId}/${factoryAddress}`;
}