import { Clients } from './processor';

// A cursor is any data that a trigger needs to keep track of to track
// its progress, for example, a block number it has processed up to.
export type Cursor = string;

type GetIfCursor<T> =
  T extends Cursor ? Cursor
  : undefined

export type Trigger<_, OptionalCursor> = (clients: Clients, cursor: GetIfCursor<OptionalCursor>) => Promise<any[]>;
