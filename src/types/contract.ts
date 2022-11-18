export type Contract = {
  id: string,
  startingBlock?: string,
  address: string
}

export type EVMContract = Contract & {
  startingBlock: string,
}
