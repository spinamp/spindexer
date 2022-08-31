# Spindexer

Spindexer is a web3 indexer built to be fast, scalable, parallelizable, highly featureful and sufficiently decentralized. It can index from both on-chain and off-chain sources across multiple chains and offchain APIs. It is currently specialized to focus on music nft indexing.

Spindexer runs as multi-stage processing pipeline that generates a comprehensive web3 music database including nfts, nft activity, platforms, tracks and artists.

It builds artist profiles that are aggregated across all their cross-platform activity into cohesive, discographic views.

## Overview of how it works
Spindexer works by:
 - Indexing on-chain music nft activity across multiple chains
 - Augmenting that on-chain data with additional external info needed (eg: from off-chain, centralized sources, ipfs and arweave, etc)
 - Transforming and connecting the data into a more comprehensive, cohesive and standardized schema
 - Storing and maintaining an up-to-date, real-time API for web3 music

## Dependencies
 - NodeJS/yarn setup (v18.5.0 recommended)
 - Postgres installed (v14.4 recommended)
 - Postgres running
 - postgresql-client installed
 - ts-node installed globally
 - git-lfs

## Setup
 - Copy .env.example to .env and fill it in. Make sure to change the example passwords and keys.
 - Set up a postgres server with admin username/password
 - Bootstrap the DB for the pipeline. This will create db users for the pipeline:
   - ```DB_SUPERUSER=postgres DB_SUPERUSER_PASSWORD=password yarn bootstrap-db```
 - Ensure the Postgres server forces SSL only.
 - Ensure the SSL certificate for the postgres server is stored at db-ssl-certificate.pem if needed. If you're using AWS RDS, you can copy rds-ssl-certificate.pem to db-ssl-certificate.pem for convenience
 - Setup the config for each external dependency (We recommend fast, dedicated endpoints for fast indexing that cache indexed content):
   - Ethereum provider for querying Ethereum
   - Solana provider for querying Solana
   - Blocks Subgraph for querying Ethereum block timestamps
   - IPFS endpoint for accessing IPFS content
   - IPFS pinning api url for pinning ipfs content to your own node
   - IPFS RPC endpoint for adding new content to IPFS
   - IPFS pinning api url for pinning ipfs content to a node

 - Bootstrap the DB with a recent backup so that you don't have to index from scratch:
   - ```yarn restore-db```
   - (You may see a single error related to role "rdsadmin" does not exist - this can be ignored)

## Running
The indexer runs via a single node script. This script starts a single node process. The process will create the database if needed on the first run (unless it has been restored from backup), index until it is up to date, and then terminate. Each time the script is run, the index will be caught up to date.

The script is intended to be run repeatedly, each time it ends, much like a lambda function. It can be run with:
```
yarn start
```

In production, we recommend running the script once a minute to keep it up to date every minute. A quick/simple way to do this is:
```
watch -n 60 "yarn start >> ./log" 2>&1
```

## Operations
Sometimes things fail (eg: an offchain API is down). This is fine and expected. Things should continue as expected on the next run of the script. Most NFTs/Tracks/Platforms that cause failure/errors are moved into an error queue and retried a few times after some delay so that they don't block progress for the rest of the indexer.

When experimenting or testing new PRs that may have breaking changes, you may want to reset the db often or test rebuilding on specific tables. The reset-db and restore-db-table yarn commands should be helpful for this. (For example, often after a reset you may want to restore the raw_ipfs_pins and raw_ipfs_files table instead of recreating them again so that you don't need to wait for that again), ie:

```
yarn restore-db-table raw_ipfs_pins
yarn restore-db-table raw_ipfs_files
```

## Design Goals
There are a few design goals for the system:
 - Be fast, up to date and have low latency liveness
 - Be reliable with minimal/zero maintenance need.
 - Handle crashes, downtime and errors gracefully, resuming without needing to rebuild the DB or being blocked by external dependencies
 - Support both onchain, multichain, offchain and centralized data sources
 - Allow extensions with additional new contracts and platforms without requiring a DB rebuild nor re-processing from start
 - Allow extensions with additional metadata or data transformations being added without requiring a DB rebuild nor re-processing from the start
 - Allow for decentralization and even some consensus without any co-ordination

## Contributing
The repo is still early and not hyper-polished or perfectly documented. Contributor guidelines are not ready yet, clear development docs and style/standard expectations are not extremely well documented yet. Interfaces are not well documented yet. Keep this in mind, so if you'd like to contribute:
 - First, reach out on Discord and connect with the team (https://discord.gg/8YS3peb62f) so we can help guide you in contributing
 - Read through the [Architecture](./Architecture.md) and [Ingestion](./Ingestion.md) docs which have some more details on the architecture and concepts used in the repo
 - Try set things up yourself, test it out, read the code.
 - Read the code some more, especially getting familiar with the [Processor](./src/types/processor.ts), [Trigger](./src/types/trigger.ts) and [Platform](./src/types/platform.ts) types and how they're used as interfaces :)
 - Check out the Github Project and Github Issues, still being improved
