---
name: New artist integration evaluation
about: Form for evaluating the integration of a new artist into the Spindexer
title: "[NEW ARTIST INTEGRATION]"
labels: ''
assignees: ''

---

### Motivation

When a request for new artist integration into the Spindexer is made we need to technically evaluate the request upfront.

A developer should read the [basic integration guide](/docs/basic_integration_guide.md) and collect the information required for the "Exploring and Collecting Details" section.

### Checklist for evaluation of integration request

```ts
// Use a `platform` to represent the artist or artist collaboration.
const EXAMPLE_PLATFORM: MusicPlatform = {
  id: '0x719...',                              // artist/artist-collaboration address [1]
  type: MusicPlatformType['x-track-y-prints'], // # of tracks & # of NFTs minted      [2]
  name: 'danielallan.xyz',                     // artist's official website           [3]
}

// Use an `nftFactory` to represent the contract which houses the album/collection/tracks.
const EXAMPLE_ALBUM_OR_TRACK_COLLECTION: NftFactory = {
{
  id: '0x141...',                            // album/collection/track address              [4]
  startingBlock: '15151004',                 // earliest block number                       [5]
  platformId: EXAMPLE_PLATFORM.id,           // new/existing platform id                    [6]
  standard: NFTStandard.ERC721,              // contract type (relates to the chain)        [7]
  contractType: NFTContractTypeName.default, // other contract variation (custom or forked) [8]
  autoApprove: true,                         // purely music or mixed-media NFT collection? [9]
  typeMetadata: {
    overrides: {                             // special treatment of track metadata        [10]
      // track: { ... }                      //
      // artist: { ... }                     //
      // type: { ... }                       //
      // extractor: { ... }                  //
    }
  }
}
```
