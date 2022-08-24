# Operations

Here are some useful commands while operating things:

## DB Management

Save the database backup:
```bash
yarn save-db
```

Drop the database:
```bash
yarn connect-db-root
```
and then
```sql
drop database web3_music_pipeline;
```

Restore the database:
```bash
yarn restore-db
```

## SQL Queries

```sql
-- Clear all erc721nfts where there was an error with their metadata or processing them into tracks so they can be tried again:
select * from "nftProcessErrors";
delete from "nftProcessErrors";
```

```sql
-- Clear all ipfs upload errors so they can be tried again:
delete from "ipfsFiles" where error is not null;
```

```sql
-- Clear all noizd nfts:
delete from processors where id='createNFTsFromERC721Transfers_0xf5819e27b9bad9f97c177bf007c1f96f26d91ca6';
delete from erc721nfts where id like '%0xf5819e27b9bad9f97c177bf007c1f96f26d91ca6%';
```

```sql
-- Clear all tables except nfts:
delete from "processedTracks";
delete from "artistProfiles";
delete from "artists";
delete from processors where id in ('stripIgnoredNFTs','createProcessedTracksFromAPI_noizd');
```
