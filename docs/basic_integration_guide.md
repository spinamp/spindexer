# Basic Integration Guide for Artist's Tracks/Albums/Collections

This is a comprehensive guide for what we call a "simple integration".

These are often simple requests from Web3 artsts to index their latest track, a full album, or some kind of collection of NFTs that isn't already being indexed by Spindexer.

### Starting Off

Assuming you have nothing more than a URL pointing to a Web3 artist, their tracks, their album, or an NFT collection, your goals are simple to start with:

1. Explore and collect details about the artist integration
2. Understand whether existing code can process the music NFTs
3. Estimate the scope of work

## Exploring and Collecting Details

### Finding good sources of information
First, visit the submitted artist URL. Poke around and get a sense of where you'll find your primary sources of technical information.

Some examples include:

- https://opensea.io/
- https://www.magiceden.io/

Once you find a solid primary resources, search for the contract on [etherscan.io](https://etherscan.io) or [solscan.io](https://solscan.io) and begin collecting information for building out a new integration.

### Which details to collect?
The following key information is needed to build a simple integration. It is based on common integrations found in `src/db/migrations` .

*Hint: Use the annotation numbers in the example below to find out more about a particular detail.*

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

## Understanding Pre-Existing Processing Strategies

After having collected and considered details about the artist integration, it is important to understand which of the details fit nicely into the existing platform processors in [2].

Also, become familiar with the variety of custom platform processors in `src/types/platform-types.ts` to look for common patterns in dealing with any idiosyncracies.


## Estimating Scope of Work

This last part should be much easier to do with all the details and thought from the first few steps (exhausting as they were).

Generally:
- the more that a "simple integration" overlaps with the existing platform processors in [2], the smaller the scope of work
- more custom and non-standard the contract, the more likely for the scope to grow
- when metadata for the NFT is difficult to restructure, non-standard, or entirely custom to incorporate, the greater the scope of work

It is also important to know what to expect after the integration is complete, so try jot down the number of tracks that are expected to be added to the Spindexer.

---

## Appendix: Exploring & Collecting Details Hints + FAQ

[1] Artist/artist-collaboration Address

- Firstly, check whether the Artist ('platform') already exists from a previous integration, and avoid creating a new one by simply referring to the previous 'platform'
- Otherwise, find the address of an artist by looking into an NFT, finding details on the artist, and looking for a link to their Ethereum/Solana wallet address. This will be different from the NFT address and is often linked to a `.eth` ENS record.

[2] Number of tracks & number of NFTs minted

- Looking at the collection on OpenSea, take a look at the structure of the collection. Depending on whether there are repeated NFTs in the collection, you can try to categorize the collection to use some of our existing platform processors:
  - Many different tracks and non-repeating images - `MusicPlatformType['multi-track-multiprint-contract']`
  - Many tracks with many repeated images - `MusicPlatformType['multi-track-multiprint-contract']`
  - Single track with many repeated images - `MusicPlatformType['single-track-multiprint-contract']`
- If it doesn't seem to fit the categorization, a custom mapper might be needed

[3] Artist's official website

- The artist/collab's official website is usually shown on an NFT or the collection. Otherwise use a search engine to find the artist's official website or platform.

[4] Album/collection/track address

- For an album or a collection, this is usually found via an Etherscan/Solscan link on the page via OpenSea.

[5] Earliest block number

- Looking at the collection through Etherscan/Solscan, check the list of transactions to find the earliest transaction block.
- Etherscan/Solscan shows the last 25 transactions by default so make sure to expand the full list to find the earliest block!

[6] New/existing platform id

- Relates to the platform described in [1].

[7] Contract type (relates to the chain)

- Check the "Contract" tab on Etherscan/Solscan. You should see what kind of contract has been deployed. Generally, Ethereum contracts will follow ERC721 contracts or some similar custom implementation (see [8]) while Solana contracts follow Metaplex.
- We currently support ERC721 and Metaplex NFT standards. ERC1155 contracts coming soon!

[8] Other contract variation (custom or forked)

- Standard ERC721 contracts are usually deployed for music NFTs, but some platforms like Nina and Zora have custom implementations. Check the "Contract" tab on Etherscan/Solscan to skim read the contract's code.

[9] Purely music or mixed-media NFT collection?

- Because we're mostly interested in indexing Web3 music and audio (currently), we'd like to avoiding indexing contracts that are purely for images or other non-audio media.
- Along similar lines, some NFT collections contain snippets of audio (voice notes, goats bleeting, etc) that we likely don't want to include in our music library.
- If either of these seem to be the case in the collection, a good strategy is to switch `autoApprove` off and to manually approve the desired NFTs using our [approvals mechanism](https://github.com/spinamp/spindexer/pull/78).

[10] Special treatment of track metadata

- To correctly index Web3 music NFTs, we also need to know details about the audio track, including its name, description, source URL, etc. These metadata fields are not standardized however, so inspecting the NFT metadata is critical.
- An example of NFT metadata can be found on a particular NFT in OpenSea, in its "Details" section usually in a link labelled "TokenId".
- Inspect the data structure to try to cross-reference it to the way a `ProcessedTrack` is compiled within `MapTrack` for the generalized strategies in section [2].
- If the structure doesn't fit exactly to the existing mappers, consider implementing and extending the library of field extractors in `fieldExtractor.ts` and using them in the `overrides: { extractors: { ... } }` type metadata.