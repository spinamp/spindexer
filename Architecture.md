# Architecture

## Consensus without co-ordination
In order to support decentralization without introducing a complex peer-to-peer network nor consensus for co-ordination, all nodes that run the indexer should be expected to generate the same output and same database, such that if a client switches to a different node, it continues working as expected.

This means that all logic/data should be implemented as something like a CRDT (https://en.wikipedia.org/wiki/Conflict-free_replicated_data_type).

The current repo aims for this. It's not perfect, but it's close enough and for the most important bits of data (ie, identifiers for all records) it does this well.

## Code/Data Architecture
In order to facilitate some of the above goals, the pipeline has seperate processers that are each able to track their progress processing data across different dimensions, for example:
 - Time/blocks: As time or blocks pass, a processor may need to progress with new blocks and track how far it has gone.
 - Stages: Each record in the DB may be processed in multiple stages and so this progress needs to be tracked. For example, a new track may enter the DB with just an ID and a smart contract address first. Then Ethereum may be queried to get it's tokenURI. Then IFPS may be queried to get it's metadata. Then some other centralized platforms may be queried to augment that data.

Processors check their progress using a trigger.

### Processors
A processor is a combination of:
 - a trigger, which determines whether or not a processor should run, and also gathers and provides input data to that processor
 - an optional cursor, which may be used in tracking the progress of a processor
 - a processing function that does something with new input data

Whenever the pipeline binary starts, all processors run one by one. Each time a processor runs, it loops until it is completed. Processors could in theory be run in parallel, as the design of each processor should guarantee that order in which they run does not matter, but this guarantee has not been verified/tested and may have some imperfections because at the moment this simple ordered runner is sufficient.

### Triggers
A trigger is a function that runs at the start of a processor. Triggers and their processors are stateful, as they effectively track progress as they run.

Triggers and their processors need to ensure that they makes progress every time they run, no matter what, so that they avoid an infinite loop. This means that every time a processor runs, it must make some change to the database that ensures the same input will not arrive again in the next loop.

There are 2 main ways in which these updates can result in progress:
 - With extra trigger/processor metadata: A processor can store a cursor to track its progress (for example, latestEthereumBlockProcessed)
 - Intrinsically, within the data it processes: A processor can modify the records from its input so that they do not trigger on the next run (For example, the metadata processor queries for any metadata records with null metadata field and null metadataError and processes them. Each run, it will modify every record by either adding the metadata field when successful, or adding the metadataError field when failing. This means that those records won't be part of future trigger.)

It is usually preferable for a processor to track progress intrinsically, rather than with an extra cursor when possible. This tends to lead to looser coupling between processors and parrelelizabilty, so is a good principle to follow.

Each processor should track its progress as precisely as possible, so that when future data sources and processors are added, that source can catch up and process independently of any others.

Another way to think about triggers based on these examples:
 - Cursor based: In the first example, the dimension of progress, ie, time/blocks generally applies to a data source being ingested and the information about progress is stored directly by the processor. Other examples in this category could be: New tracks being added into the web3-music-subgraph, New Ethereum events, An nft transfer/change of ownership.
 - Cursorless: In the second example, ie, IPFS data ingestion, progress generally applies to a specific record. Each record effectively tracks it's progress itself, independently of others. Cursorless triggers should aim to be idempotent, and so should always modify their record such that the record is no longer triggered on future runs. *(As an alternative, a processor could perhaps track all records that it has processed, however for many processors it makes more sense to effectively track progress on records rather than stages.)*

*Note: This isn't perfect. There may be cases where there is a dependency across processors, For example, imagine Sound.xyz adds some feature where if you hold 2 golden eggs at the same time, you get a special platinum egg. In this case, there would be a dependency between nft ownership and platinum eggs. This means that if the nft ownership processor is completed but the golden egg processor is not, we would have to re-run the nft ownership processer again to make sure we didn't miss any instances where a user was temporarily holding 2 golden eggs and minted a platinum egg. Perhaps a more powerful design could also allow specifying explicit dependencies across sources for re-calculation.*

In addition to fulfilling the above design goals, this kind of process architecture will make it super easy to parallelize the pipeline in future if ever needed.
