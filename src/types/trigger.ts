import { Clients } from './processor';

// A cursor is any data that a trigger needs to keep track of to track
// its progress, for example, a block number it has processed up to.
export type Cursor = string;

export type GetIfCursor<T> =
  T extends Cursor ? Cursor
    : undefined

export type TriggerOutputItems = any[];

export type TriggerOutput = TriggerOutputItems | {
  items: TriggerOutputItems
  newCursor: Cursor
}

export type Trigger<OptionalCursor> = (clients: Clients, cursor: GetIfCursor<OptionalCursor>) => Promise<TriggerOutput>;
