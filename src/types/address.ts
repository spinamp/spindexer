type EthereumAddress = string;

export const formatAddress = (address: EthereumAddress) => {
  return address.toLowerCase();
}
