export type EVMBlockNumberField = {
  createdAtBlockNumber?: string;
}

export type DateTimeField = {
  createdAtTime: Date;
}

export type TimeField = EVMBlockNumberField & DateTimeField;

export type IdField = {
  id: string
}

export type Record = IdField & TimeField

export type RecordUpdate<Type> = Partial<Type> & IdField
