# Operations

Here are some useful commands while operating things:

```sql
-- Clear all erc721nfts where there was an error getting the object from the metadata url so that they can be tried again:
update erc721nfts SET "metadataError"=null where "metadata" is null and "metadataError" is not null;
```

```sql
-- Clear all erc721nfts where there was an error processing them into tracks to they can be tried again:
select * from "erc721nftProcessErrors";

delete from "erc721nftProcessErrors";
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
delete from "erc721nfts";
delete from processors where id in ('stripIgnoredNFTs','createProcessedTracksFromAPI_noizd');
```
