# Operations

Here are some useful commands while operating things:

```sql
-- Clear all tracks where there was an error getting their metadata from the metadata url so that they can be tried again:
update tracks SET "metadataError"=null where "metadata" is null and "metadataError" is not null;
```
