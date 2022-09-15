export type EthereumAddress = string;

export const ETHEREUM_NULL_ADDRESS = '0x0000000000000000000000000000000000000000'

export const newMint = (fromAddress: EthereumAddress): boolean => {
  return fromAddress === ETHEREUM_NULL_ADDRESS;
}
