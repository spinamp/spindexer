import { EVMAddress } from './evm';

export const formatAddress = (address: EVMAddress) => {
  return address.toLowerCase();
}
