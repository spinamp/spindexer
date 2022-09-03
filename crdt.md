The spindexer crdt is designed to support p2p mutations of a replicated dataset.

Mutations are performed on a piece of data using messages. Messages are stored in a central location. At the current state of the spindexer infrastructure, there is only a single spindexer node running and therefore the messages are stored within the spindexer database. Once there are multiple spindexer nodes running, messages will be stored externally using a publicly accessible storage solution, so that all instances of spindexer can read/write to the messages list.

Note: this is not a fully p2p design as it relies on the central storage of the messages list.


# Messages
Messages are the mechanism for mutating data within spinamp. Messages are a G-Set, meaning that messages can only be appended to the messages list.

Messages consist of a timestamp to provide order, the dataset, the field, and the value to mutate. Messages are idempotent, meaning that the same messages can be applied multiple times and result in the same mutations being applied and arriving at the same final state.
Messages are commutative, in that messages can be applied in any order, but will only be applied if a newer timestamp for the same column and id has not been seen yet. This means messages must be processed using a last write wins (LWW) strategy

For the initial implementation timestamps in nanoseconds are used to timestamp messages, but this is not a robust solution in a distributed system. This assumes no messages are generated at the same time and that all clients have synchronised clocks. In a future implementation this should be replaced with a hybrid logical clock (HLC) to remove those assumptions

# Processed Messages
Processed messages keep track of which messages have been processed. This way we know which messages have not yet been processed.

# Processing logic

All messages can be processed as upserts. In the future a 'tombstone' field can be added to a message that will add the ability to mark records as deleted. This requires a database migration to include the tombstone field on each entity, and is not included in the initial requirements so is being ignored for now.

to process a message:
  find all existing messages for the same table, column, id
  find max timestamp from existing messages