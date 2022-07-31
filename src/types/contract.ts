export type Contract = {
  address: string,
  startingBlock?: string,
}

export type EthereumContract = Contract & {
  startingBlock: string,
}
