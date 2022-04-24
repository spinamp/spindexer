# web3-music-pipeline

This code is intended to become a multi-stage processing pipeline that generates a comprehensive web3 music database and:
 - Augments on-chain data with additional info needed (eg: from off-chain sources/ipfs)
 - Transforms data into a more comprehensive, robust schema
 - Saves and keeps alive an updated real time DB

## Requirements to run
 - NodeJS/yarn setup
 - Postgres installed
 - The Graph node setup with IPFS, postgres and https://github.com/spinamp/web3-music-subgraph running
 - postgresql-client installed

## Running it
 - Copy .env.example to .env and fill it in. Make sure to change the example passwords.
 - Set up a postgres server with admin username/password
 - Bootstrap the DB for the pipeline. This will create users for the pipeline, with: ```DB_SUPERUSER=postgres DB_SUPERUSER_PASSWORD=password yarn bootstrap-db```
 - Ensure the postgres server forces SSL only.
 - Ensure the SSL certificate for the postgres server is stored at db-ssl-certificate.pem if needed. If you're using AWS RDS, you can copy rds-ssl-certificate.pem
 - Setup ethereum provider and subgraph endpoints
 - yarn build
 - **Optional:** Bootstrap the DB with a recent backup by running ```yarn restore-db```
 - yarn start
 - This should start up the server. It will seed your database from a recent backup if the database is not yet created, and then catch up the database with the latest data until it is up to date
 - Repeat yarn start to catch up

## Design Goals
There are a few design goals for the code:
 - Be fast, up to date and have low latency liveness
 - Be reliable with minimal/zero maintenance need.
 - Handle crashes, downtime, resume without needing to rebuild the DB
 - Support both onchain, multichain, offchain and centralized data sources
 - Allow extensions with additional new contracts and platforms without requiring a DB rebuild nor re-processing from start
 - Allow extensions with additional metadata or data transformations being added without requiring a DB rebuild nor re-processing from the start

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
A processor is a combination of:
 - a trigger, which determines whether or not a processor should run, and also gathers and provides input data to that processor
 - an optional cursor, which may be used in tracking the progress of a processor
 - a processing function that does something with new input data

Whenever the pipeline binary starts, all processors run one by one. Each time a processor runs, it loops until it is completed. Processors could in theory be run in parallel, as the design of each processor should guarantee that order in which they run does not matter, but this guarantee has not been verified/tested and may have some imperfections because at the moment this simple ordered runner is sufficient.

## Triggers
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
