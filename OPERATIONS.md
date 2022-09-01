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
select * from raw_nft_process_errors;
delete from raw_nft_process_errors;
```

```sql
-- Clear all ipfs upload errors so they can be tried again:
delete from raw_ipfs_files where error is not null;
```

```sql
-- Clear all noizd nfts:
delete from processors where id='createNFTsFromERC721Transfers_0xf5819e27b9bad9f97c177bf007c1f96f26d91ca6';
delete from erc721nfts where id like '%0xf5819e27b9bad9f97c177bf007c1f96f26d91ca6%';
```

```sql
-- Clear all tables except nfts:
delete from raw_processed_tracks;
delete from raw_artist_profiles;
delete from raw_artists;
delete from raw_processors where id in ('stripIgnoredNFTs','createProcessedTracksFromAPI_noizd');
```

```sql
--- Example: Update a bunch of deeply nested entries in records in a table:
update raw_nft_factories
set "typeMetadata" =
jsonb_set(
  "typeMetadata", '{overrides,artist, "artistId"}',
  format(
    '"ethereum/%s"',
    lower("typeMetadata"->'overrides'->'artist'->>'artistId')
  )::jsonb
)
where "platformId"='zora';
