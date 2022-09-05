export type Contract = {
  id: string,
  startingBlock?: string,
}

export type EthereumContract = Contract & {
  startingBlock: string,
}
