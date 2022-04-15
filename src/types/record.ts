export type EthereumBlockNumberField = {
  createdAtEthereumBlockNumber?: string;
}

export type DateTimeField = {
  createdAtTime: Date;
}

export type TimeField = EthereumBlockNumberField & DateTimeField;

export type IdField = {
  id: string
}

export type Record = IdField & TimeField

export type RecordUpdate<Type> = Partial<Type> & IdField
