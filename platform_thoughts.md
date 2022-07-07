platform thoughts.md

The pipeline has a concept of a music platform, as well as the concept of a music platform type.

Music Platforms are records in the DB
Music Platform types are statically typed, hard coded types with a related type config that specifies config about that type.

Example platform:
```ts
const ROHKI_PLATFORM = {
  id: 'rohki',
  type: MusicPlatformType['single-track-multiprint-contract'],
  name: 'rohki desperado',
}
```

Example platform type:
```ts
export enum MusicPlatformType {
  ...
  'single-track-multiprint-contract' = 'single-track-multiprint-contract',
  ...
}
```
Corresponding type for the type config:
```ts
export type MusicPlatformTypeConfig = {
  mappers: PlatformMapper
  clientName: string | null
  initialTrackCursor?: string
};
```

The above platform and platform type concepts are coupled to the below functionality:
 - (platform) the human-meaningful platform that a contract, nft and track is associated with
 - (platform) the category to slice out a batch of nfts that get processed together in the processPlatformTracks processor
 - (platformType) the client that is used when processing platform nfts
 - (platformType) the platform type mappers used to process platform nfts
 - (platform) the slice, client, related config and mapper for the createProcessedTracksFromAPI processor

With the above, specifying a platform also implies a single platformType. We likely want to decouple all the above functionality a bit more to support wider flexibility.

One example, next up, is adding support for Zora NFTs.

Zora has the following nuances:
 - Zora is both an underlying technology and a user-facing website/platform
 - Zora's tech is used by both their own website/platform and by others
 - Specifically, the 2 things we care about are:
   - A) Zora's original main v1 launch NFT contract
     - This contract was used for a mix of different NFT mints, both music nfts and other kinds of nfts.
     - It was used by the Catalog platform for their original mints (which currently already are indexed via this contract)
     - It was also used by the Zora platform for music NFTs minted directly (which are not currently indexed properly)
   - B) Zora's new NFT-contract creator factory
     - This factory generates contracts that are used for minting NFTs.
     - Some of them we'll want to ascribe to Zora as the platform
     - Others have their own website/identity and we'll want to ascribe to a different platform
     - They may be used for music nfts, or non-music nfts, or whatever else

This use case demands we decouple the platform as a human-meaning concept from the platformType as an underlying technology/pattern to process:
 - We have an example where a platform has 2 different underlying technologies, so will need 2 different type mappers depending on the contract. (ie, Zora v1 vs new Zora factory)
 - We also have an example where a single technology & contract corresponds to 2 different real-world platforms (ie, both Catalog tracks and Zora tracks on the original Zora v1 contract)

Minimal decoupling plan to get Zora fully supported:
 - (1): Decouple the 1:1 implication of platform -> platformType
   - Table.platforms.type can still stay as the 1:1 association, but it should be capable of being overridden by factories or contracts
   - Allow type to be overridden by contract
   - Ensure type override is checked by the processPlatformTracks processor (and createProcessedTracksFromAPI processor?) for each nft, based on that nft's contract + platform with a contract override taking precedence
 - (2): Support Zora V1 NFTs that aren't from catalog
   - Add ZoraV1 type that can process those nfts, but with some kinda whitelist on nfts since ZoraV1 nfts may not all be audio, and are not all proper tracks/songs, even if they're audio
   - Add ZoraV2 factory that can generate contracts of zora type, but with no platform specified as platform will be unknown, maybe with a way to add the platform later (maybe similar to how it's done in the categorizeZora processor?)
