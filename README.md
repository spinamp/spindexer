# subgraph-pipeline

This code is intended to become a multi-stage processing pipeline that processes the web3-music-subgraph and:
 - Augments the database with additional info needed (eg: from off-chain sources/ipfs)
 - Transforms the database into a more comprehensive schema
 - Saves a new dump of the DB

## Running it
 - Copy .env.example to .env
 - Setup ethereum provider and subgraph endpoints
 - yarn build
 - yarn start

## Design Goals
There are a few design goals for the code:
 - Be fast, up to date and have low latency liveness
 - Be reliable with minimal/zero maintenance need.
 - Handle crashes, downtime, resume without needing to rebuild the DB
 - Support offchain and centralized data sources
 - Allow extensions with additional new contracts without requiring a DB rebuild nor processing from start
 - Allow extensions with additional stages being added without requiring a DB rebuild nor processing from the start

# Infrastructure Architecture
 - The input comes from ethereum events that have been ingested via the Graph
 - This code is just a single nodejs typescript thing that does all the processing and saves state into memory and locally on disk in a JSON file. This could be changed to a proper DB like Postgres later on, but the current goal is to get working and polished first before using a proper DB.
 - The intention is that the code can eventually just be run in a labmda function automatically and trigger on every ethereum block doing small updates each block as needed.

# Code/Data Architecture

In order to facilitate some of the above goals, the pipeline has seperate processers that are each able to track their progress processing data across different dimensions, for example:
 - Time/blocks: As time or blocks pass, a processor may need to progress with new blocks and track how far it has gone.
 - Stages: Each record in the DB may be processed in multiple stages and so this progress needs to be tracked. For example, a new track may enter the DB with just an ID and a smart contract address first. Then Ethereum may be queried to get it's tokenURI. Then IFPS may be queried to get it's metadata. Then some other centralized platforms may be queried to augment that data.

Processors check their progress using a trigger.

## Processors
A processor is a combination of a trigger, optional cursor and processing function that decides what to do with new data.

## Triggers
A trigger is a function that a processor runs to check if there is anything new for it to process. This may or may not involve a cursor, for example:
 - The NFT processor that tracks new NFT mints runs over all blocks one by one and will keep track of the most recent block it has processed in a cursor
 - The track metadata processor just queries for any tracks that have not yet had their metadata processed. It does not need to track a cursor, but rather just keeps going until the query is empty and there is nothing left for it to process.

Each processor should track its progress independently so that when future data sources and processors are added (eg: new smart contracts), that source can catch up and process independently of any others.

Another way to think about triggers based on these examples:
 - Cursor based: In the first example, the dimension of progress, ie, time/blocks generally applies to a data source being ingested and the information about progress is stored directly by the processor. Other examples in this category could be: New tracks being added into the web3-music-subgraph, New Ethereum events, An nft transfer/change of ownership.
 - Cursorless: In the second example, ie, IPFS data ingestion, progress generally applies to a specific record. Each record effectively tracks it's progress itself, independently of others. *(As an alternative, a processor could perhaps track all records that it has processed, however for many processors it makes more sense to effectively track progress on records rather than stages.)*

*Note: This isn't perfect. There may be cases where there is a dependency across processors, For example, imagine Sound.xyz adds some feature where if you hold 2 golden eggs at the same time, you get a special platinum egg. In this case, there would be a dependency between nft ownership and platinum eggs. This means that if the nft ownership processor is completed but the golden egg processor is not, we would have to re-run the nft ownership processer again to make sure we didn't miss any instances where a user was temporarily holding 2 golden eggs and minted a platinum egg. Perhaps a more powerful design could also allow specifying explicit dependencies across sources for re-calculation.*

In addition to fulfilling the above design goals, this kind of process architecture will make it super easy to parallelize the pipeline in future if ever needed.

# Runner
Each processor could in theory run in parallel, but at the moment there is a simple runner that just loops across all processors over and over until all are up to date.
