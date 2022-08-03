*Note: This doc is a bit out of date*

# Overview
To ingest custom contracts and platforms, we need a mechanism to standardize across all platforms.

## Data Sources

### NFTs
An nft source is some data source that produces nfts.

At the moment, only ERC721 Contracts are supported, but other standards, chains and platforms will be added in future

Sources:
 - ERC721 Contract: An Ethereum smart contract that follows ERC721 and mints NFTs that include media metadata via the tokenURI or other fields on the contract.

#### ERC721Contract => NFT
NFT production from ERC721Contracts happens in the createERC721NFTsFromTransfers processor. The processor queries for transfer events and creates an NFT whenever it detects a new mint. It will process the transfer data based on rules for each type of contract. Each contract needs to have type.

A contract type is a specification that provides the following:
- contractCalls: An array with a list of functions that should be called for each nft from that contract to retrieve additional data about that NFT. Currently only tokenURI and tokenMetadataURI are supported
- contractMetadataField: A field that determines which contract call provides the actual metadata for the NFT
- buildNFTId: A function that takes a contract address and token id and produces a unique id for the nft

The following contract types exist:
 - Zora: Type for the original Zora contract, which has a non-default tokenMetadataURI field
 - Default: Type for all other default erc721 contracts

Actual ERC721Contracts are stored in the DB with the following fields:
- address: The address of the contract
- platform: The platform that the nfts produced by the contract should have (used below, in track processing)
- startingBlock: The starting block for watching the contract
- contractType: The type of the contract, as above

### Tracks
A track source is some data source that produces tracks.

At the moment 2 types of sources are supported:
 - ERC721NFTs: An existing ERC721 NFT within the pipeline database that can produce a track
 - APIs: An external API that can produce tracks

The pipeline will ingest the source, augment it with additional data if needed, and then map the data into its own schema to produce a track.

#### ERC721NFT => Track
Track production from ERC721NFTs happens in the processPlatformTracks processor. Each platform has its own instantiation of the processor which will query each NFT from that platform and then process it based on the rules of that platform. Each platform needs to have a type, which consists of a client and mapper that provides the following:

- mapper.mapNFTsToTrackIds implementation: A function that maps an array of NFTs into an array of track Ids
- client.fetchTracksByTrackId: A function that takes a list of track IDs, queries external APIs and returns all metadata for those tracks that come from an external API, if any.
- mapper.mapTrack implementation: A function that takes the NFT as well as augmented external API data and produces a track with logic for deciding on the following fields:
  - id
  - platformInternalId
  - title
  - description
  - lossyAudioURL
  - lossyArtworkURL
  - websiteUrl
  - artistId
- mapper.mapArtistProfile: A function that takes as input the track data from the external API, if any, as well as the first NFT known for that track, if any, and produces an artist profile with logic for deciding on the following fields:
  - name
  - artistId
  - platformInternalId (for artist)
  - avatarUrl
  - websiteUrl

This then results in a new Track and ArtistProfile being produced. Both are upserted into the DB.

The following platform types exist:
 - NOIZD: Type for NOIZD platform NFTs
 - Catalog: Type for Catalog platform NFTs
 - Sound: Type for Sound.xyz platform NFTs

Actual platforms are stored in the DB with the following fields:
- id: The id of the platform
- type: The platform type for the platform

#### API => Track
Track production directly from external APIs is supported too. This is primarily used for ingesting tracks before a NFT may exist for that track, for example on NOIZD where NFTs are only created after an auction completes.

This uses the createProcessedTracksFromAPI processor. Each platform has its own instantiation of this processor which will query each track from that platform and then process it based on the rules of that platform. Each platform needs to have a client and a mapper that provides the following:

- client.fetchLatestTrackCursor: A function that retrieves a cursor or timestamp from the API for the most recent track it has.
- client.getTracksFrom: A function that queries for all tracks newer than some cursor
- client.getAPITrackCursor: A function that gets the cursor for a particular track from that track.
- client.mapAPITrack: A function that takes the api track produces a pipeline track with logic for deciding on the following fields:
  - id
  - platformInternalId
  - title
  - description
  - lossyAudioURL
  - lossyArtworkURL
  - websiteUrl
  - artistId
- mapper.mapArtistProfile: As above

## Example sources

### Example NFT sources
 - Original Zora contract
 - New catalog contract
 - Original NOIZD contract
 - All sound.xyz contracts, as produced by the createERC721ContractFromFactoryProcessor (not yet documented)
 - Various other custom NFT contracts

## Improvements to do

### More high level types
For platforms, especially with ERC721NFT => Track, maybe they can be classed into types like:
- High level Types:
  - 1of1, mixed content, shared across multiple artists/track (eg: zora)
  - 1of1, all single tracks, shared across multiple artists and tracks (eg: noizd, new catalog)
  - 1ofn, all single tracks, single artist but shared across multiple tracks (eg: soundxyz)
- Other flags
  - Possibly has premint or not?

### More real world examples to consider and incorporate:

cam murdoch
  - address: 0x9d446b745926001fdf78e277d9985a59970f2aac
  - mapper.mapNFTsToTrackIds: contract_address + nft.trait_type["title"] or name.dedup -> see extra unescape tho
  - client.fetchTracksByTrackId: => null
  - mapper.mapTrack:
    - id: trackId
    - platformInternalId: nft.trait_type["title"] or name.dedup
    - title: nft.trait_type["title"] or name.dedup
    - description: nft.description
    - lossyAudioURL: animation_url, but includes video and is uncompressed
    - lossyArtworkURL: image
    - websiteUrl: external_url
    - artistId: trait_type":"Artist or contract.owner
- mapper.mapArtistProfile:
  - name: trait_type":"Artist" or nft.created_by
  - artistId: trait_type":"Artist or contract.owner
  - platformInternalId: contract.owner
  - avatarUrl: none
  - websiteUrl: none

blaire:
  - address: 0x64d857617eb0d31e0385944bd85729bf278ea41d
  - mapper.mapNFTsToTrackIds: contract_address + name.dedup
  - client.fetchTracksByTrackId: => null
  - mapper.mapTrack:
    - id: trackId
    - platformInternalId: name.dedup
    - title: name.dedup
    - description: nft.description
    - lossyAudioURL: animation_url, but includes video and is uncompressed
    - lossyArtworkURL: image
    - websiteUrl: none
    - artistId: trait_type":"Artist or contract.owner
- mapper.mapArtistProfile:
  - name: trait_type":"Artist" or nft.created_by
  - artistId: contract.owner
  - platformInternalId: contract.owner
  - avatarUrl: none
  - websiteUrl: none

Jagwar Twin - 33 [Album] (JT33)
 - address: 0xf85c1f4ac0040e4f2369cfcbabfccfa2f3e6899e
 - note: has editions(x), with metadata url fragment for each, but may not need to be used
 - note: metadata is on centralized api in json file
 - mapper.mapNFTsToTrackIds: contract_address + nft.trait_type["Song Title"] or name.dedup
  - client.fetchTracksByTrackId: => null
  - mapper.mapTrack:
    - id: trackId
    - platformInternalId: nft.trait_type["Song Title"] or name.dedup
    - title: nft.trait_type["Song Title"] or name.dedup
    - description: description
    - lossyAudioURL: audio_url (animation_url has video)
    - lossyArtworkURL: image
    - websiteUrl:  external_url
    - artistId:  contract.owner
- mapper.mapArtistProfile:
  - name: nothing really...maybe modified contract.name or contract.owner ENS
  - artistId:  contract.owner
  - platformInternalId:  contract.owner
  - avatarUrl:  none
  - websiteUrl:  none really, maybe external_url on specific nft

holly:
 - address: 0x6688Ee4E6e17a9cF88A13Da833b011E64C2B4203
 - mapper.mapNFTsToTrackIds: contract_address + token id
  - client.fetchTracksByTrackId: => null
  - mapper.mapTrack:
    - id: trackId
    - platformInternalId: token id
    - title: m.name
    - description: m.description
    - lossyAudioURL: m.animation_url
    - lossyArtworkURL: m.image
    - websiteUrl: m.external_url
    - artistId: traits["Creator"] (just name)
- mapper.mapArtistProfile:
  - name: traits["Creator"] (just name)
  - artistId: traits["Creator"] (just name)
  - platformInternalId: traits["Creator"] (just name)
  - avatarUrl: nft.m.creator_thumbnail
  - websiteUrl: none really, maybe external_url on specific nft

talk time:
 - address: 0x28783A20548092Fa6C9ccd55C4F58Fdd8f57293a
 - type: erc1155
 - full player in nft, @ https://ipfs.io/ipfs/QmXZzq1b7Pf7rJf3atwBhD62FRHycgsW9XiRGxsFCYgzLs/
 - actual tracks in nft too, @ tracks/xx.mp3
 - mapper.mapTokensToTrackIds: contract_address + index (hardcoded, with one token -> multiple tracks)
  - client.fetchTracksByTrackId: => null
  - mapper.mapTrack:
    - id: trackId
    - platformInternalId: hardcoded index
    - title: hardcoded[index].title
    - description: hardcoded[index].linerNotes (though is in html - may need to decode/textify)
    - lossyAudioURL: hardcoded[index].mp3Uri
    - lossyArtworkURL: hardcoded[index].artUri or maybe bgUri
    - websiteUrl: nft.external_url
    - artistId: just contract.name.split('-')? or talktime.eth? or 0xF180F7c066C9Af638b73CEEF139D5AdDE0D4265F
- mapper.mapArtistProfile:
  - name: contract.name.split('-')? or hardcoded
  - artistId: as above
  - platformInternalId: as above
  - avatarUrl: nft.image ?
  - websiteUrl: nft.external_url

async:
 - basically each new master is minted with an nft with json metadata that links to all the layers and stems
 - everything should be doable just from on-chain+ipfs metadata
 - likely need a pinning and audio processing phase to ensure high quality api though

other todos:
 - Should some contracts require approval for track creation instead of being automated? eg: if mapNFTsToTrackIds can't be 100% reliable
 - Can we add contract-wide fields, like contract.owner? Can we use contract-wide fields for a particular NFT, like for example artistId = contract.owner?
 - work out design that is clean for all 5 examples above?
 - Will mp4s mp4 with video work just naturally?
 - Can we handle song compression and reupload?
 - Can we pin and CDN all files we serve?
