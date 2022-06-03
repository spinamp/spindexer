// query:

```
query MyQuery {
  allProcessedTracks(
    filter: {artistId: {includesInsensitive: "0x8427e46826a520b1264b55f31fcb5ddfdc31e349"}}
    orderBy: CREATED_AT_TIME_DESC
  ) {
    edges {
      node {
        id
        title
        lossyAudioUrl
        lossyAudioIpfsHash
        erc721NftsProcessedTracksByProcessedTrackId(first:1) {
          nodes {
            erc721NftByErc721NftId {
              id
              metadata
            }
          }
        }
      }
    }
  }
}
```

// map into flat objects
songs = reponse.map(i=>({
  id:i.id,
  act:i.erc721NftsProcessedTracksByProcessedTrackId.nodes[0].erc721NftByErc721NftId.metadata.attributes.find(a=>a.trait_type==='Act').value,
  scene:i.erc721NftsProcessedTracksByProcessedTrackId.nodes[0].erc721NftByErc721NftId.metadata.attributes.find(a=>a.trait_type==='Scene').value
  }))

// lookup for ordering
const lookup = {
  I:1,
  II:2,
  III:3,
  IV:4,
  V:5,
  VI:6,
  VII:7,
  VIII:8,
  IX: 9,
  X:10,
  XI:11,
  XII:12,
  'Alchemy I':13,
  'Alchemy II':14,
  'Alchemy III':15,
}

// re-order
songs=songs.sort((p,q)=>{
  if( lookup[p.act] < lookup[q.act]) {
    return -1;
  }
  if( lookup[p.act] > lookup[q.act]) {
    return 11;
  }
  if (lookup[p.scene] < lookup[q.scene]) {
    return -1;
  }
  if (lookup[p.scene] < lookup[q.scene]) {
    return 1;
  }
  return 1;
})

// generate sql values input
startTimeISO = '2022-06-03T18:49:00Z'
startTime = new Date(startTimeISO)
startUnix = startTime.getTime()
songs.map((s, index) => {
  let time = new Date(startUnix + 100 - index)
  return `('${s.id}', '${time.toISOString()}'::timestamp)`
})
