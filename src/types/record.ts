export type EthereumBlockNumberField = {
  createdAtEthereumBlockNumber?: string;
}

export type DateTimeField = {
  createdAtTime: Date;
}

export type TimeField = EthereumBlockNumberField & DateTimeField;

export type Record = {
  id: string
} & TimeField
