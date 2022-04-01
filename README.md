# subgraph-pipeline

This code is intended to become a multi-stage processing pipeline that processes the web3-music-subgraph and:
 - Augments the database with additional info needed (eg: from off-chain sources/ipfs)
 - Transforms the database into a more comprehensive schema
 - Saves a new dump of the DB

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
In order to facilitate some of the above goals, the pipeline needs to be able to track it's progress processing data in a 2-dimensional way. Processing progresses along mainly 2 dimensions, ie:
 - Time/blocks: As time or blocks pass, the processing needs to progress with new blocks.
 - Stages: Each record in the DB may be processed in multiple stages and so this progress needs to be tracked. For example, a new track may enter the DB with just an ID and a smart contract address first. Then Ethereum may be queried to get it's tokenURI. Then IFPS may be queried to get it's metadata. Then some other centralized platforms may be queried to augment that data.

The first dimension of progress, ie, time/blocks generally applies to a data source being ingested. For example, new tracks being added into the web3-music-subgraph is one example. Ethereum events could be another example. An nft transfer/change of ownership is another example. Each data source should track its progress independently so that when future data sources are added (eg: new smart contracts), that source can catch up and process independently of any others.

*Note: This isn't perfect. There may be cases where there is a dependency across sources, For example, imagine Sound.xyz adds some feature where if you hold 2 golden eggs at the same time, you get a special platinum egg. In this case, there would be a dependency between nft ownership and platinum eggs. This means that if the nft ownership source is up to date but the golden egg processor is not, we would have to re-run the nft ownership processer again to make sure we didn't miss any instances where a user was temporarily holding 2 golden eggs and minted a platinum egg. Perhaps a more powerful design could also allow specifying explicit dependencies across sources for re-calculation.*

The second dimension of progress generally applies to a specific record, as in the IPFS data ingestion example above. Each record should track it's progress independently of others. As an alternative, a stage could track all records that it has processed, however given that stages tend to progress serially, it makes more sense to partition based on recrods rather than stages.

In addition to fulfilling the above design goals, this kind of 2-dimensional progress architecture will make it super easy to parallelize the pipeline in future if ever needed.

# Runner
Each processor can run in parallel, but a simple runner can just loop across all processors over and over until all are up to date.
