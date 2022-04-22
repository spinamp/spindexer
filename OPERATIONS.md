# Operations

Here are some useful commands while operating things:

```sql
-- Clear all metadatas where there was an error getting the object from the metadata url so that they can be tried again:
update metadatas SET "metadataError"=null where "metadata" is null and "metadataError" is not null;
```

```sql
-- Clear all metadatas where there was an error processing them into tracks to they can be tried again:
update metadatas SET "processed"=null WHERE "processError"=true;
```
