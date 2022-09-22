import { EthereumAddress } from './ethereum';

export const formatAddress = (address: EthereumAddress) => {
  return address.toLowerCase();
}
