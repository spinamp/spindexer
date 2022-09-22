# The Spindexer CRDT

Most content on Spindexer is just a transformed index from external sources, but there is some data that cannot be easily detected from external sources that is important for Spindexer to have (for example, Artist profile pictures are rarely on-chain or in NFT metadata).

Spindexer has a basic CRDT that is designed to augment it's core functionality to support custom mutations to the database, independent of external sources. This is intended to preserve Spindexer's ability to stay decentralized, and so designed to eventually support p2p mutations of a replicated dataset without causing consensus issues.

Mutations are performed on data in the DB via special messages that are applied to the DB using CRDT-based rules that ensure independent runs of Spindexer will eventually converge to the same database state, irrespective of the order in which messages are processed.

# Messages
Messages are the mechanism for mutating data within spinamp.

There are currently 2 supported types of messages.

Upserts: For upserting multiple columns on a record into any table, potentially creating a new record
Updates: For updating specific columns on specific records in any table

Both CRDT types have been implemented to be used as a simple, generic way to update data in the database, to serve current use cases without special custom logic.

Messages are idempotent, meaning that the same messages can be applied multiple times and result in the same mutations being applied and arriving at the same final state.

Messages are commutative, in that messages can be applied in any order, but will only have a meaningful effect if a newer timestamp for the same column and id has not been seen yet. This means messages must be processed using a last write wins (LWW) strategy

Messages consist of:
 -  timestamp: to provide ordering
 -  table: the table to be changed
 -  entityId: the id of the record to be changed
 -  values: the new values to be changed (as a json object with keys corresponding to columns)
 -  operation: upsert or update

# CRDT Message Processing Logic

Update messages will only be processed if the record they are expecting to update already exists.
Upsert messages will be processed even if the record does not exist.

During processing, the processer updates each specified column on a single record, only if no newer value for that column is known. If a newer value for that column is known, that column will not be updated.

If there is a clashing timestamp on a column, the string sort of the value of clashing messages is used to determine their order.

Deletes are not supported - in the future a 'tombstone' system may be added that can mark records as deleted, but this is not included in the initial requirements so left out for now.

There is a dedicated crdtState table that keeps track of the latest known timestamp on every column on every record that has been processed.

# Message Discovery and Processing Flow

Messages are currently only discovered using a single mechanism, the backup seed, described below.

When a new message is discovered, it is inserted into the mempool table, intended to hold messages until they're processed. Messaged are picked up by their respective processor, depending on their type, any updates are applied and then they're deleted from the mempool. Messages that are not yet ready for processing (eg: updates on nonexistent records) will stay in the mempool until ready.

The backup seed table remains persistent as an ongoing backup - messages are never deleted from it.

# Message Backup

At the moment  the current state of the Spindexer infrastructure is that there is only a single Spindexer node running with no peer-to-peer network.

Given this, even though the architecture is designed for a peer-to-peer setup, functionality for a node to accept and propagate messages via the network has not yet been implemented.

In the current implementation, there is a central backup seed of messages which is an append-only, ordered list of messages. The seed is a G-Set (https://en.wikipedia.org/wiki/Conflict-free_replicated_data_type#G-Counter_(Grow-only_Counter)), such that messages can only be appended to the messages list. Messages are added to the seed centrally as part of database migrations which store the messages into a Seeds table. These seeds also act as a central backup location for all historical messages so that if a new Spindexer node is run, it has access to all historical messages to replay them.

This does mean we still require database migrations to add new messages, but the next step to add support for messages being accepted via the network, with a basic authorization system (eg: checking signatures messages) is already supported by the existing design.

In future, once there are multiple Spindexer nodes running, historical messages will likely be backed up externally using a publicly accessible storage solution, so that all instances of Spindexer can read/write to the messages list, and p2p propagation of messages may be implemented so that the central seed is not the only way in which messages are discovered.
