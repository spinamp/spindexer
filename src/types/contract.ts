export type Contract = {
  id: string,
  startingBlock?: string,
}

export type EVMContract = Contract & {
  startingBlock: string,
}
