export type Record = {
  id: string
}

export type DBClient = {
  getLastProcessedBlock: () => Promise<number>;
  update: (tableName: string, rows: Record[], newProcessedDBBlock: Number) => Promise<void>;
  getNumberTracks: () => any;
  trackExists: (trackID: string) => Promise<boolean>;
}
