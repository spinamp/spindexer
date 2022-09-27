## Dynamic Field Extractors

In moving towards fully-automated NFT contract processing, the overrides mechanism on
`NFTFactory` can be configured to specify which strategy to use to dynamically extract
a value from the many non-standard metadata sources on music `NFT`s.

This is done by specifying a strategy in the `typeMetadata.overrides.extractor` property
on an `NFTFactory` and will only work when combined with the
`multi-track-multiprint-contract` platform type.

### Available Strategies

A minimal library of common extractor functions is available in `fieldExtractor.ts` and should
be extended with new strategies as they're encountered in newer contracts.

The goal is to be able to simply add a seed `NFTFactory` using the CRDT messages system, which
then automatically processes any dynamic fields on a collection of music NFTs. In the meantime
though, migrations are being used to add new contracts to the Spindexer.

There are three new concepts introduced in this system.

#### StrategyExtractor

An StrategyExtractor is responsible for understanding how the `NFTFactory` has been
configured, and which strategy has been chosen for a particular field. It usually
fetches a property from `typeMetadata.overrides.extractor` which is in turn used to
fetch the appropriate function from an ExtractorMapping.

#### ExtractorMappings and Extractors

ExtractorMappings are a mapping of a Strategy to their corresponding Extractors.
Extractors operate directly on an `NFT` to return a string by fetching a specific value
from an NFT's metadata.

The Extractor functions can be arbitrarily complex, composing different metadata fields
or applying data sanitization as necessary.

#### Resolvers

When processing a `multi-track-multiprint-contract`, the Resolvers are given both the
`NFTFactory` and an associated `NFT`.

The Resolver is responsible for using the selected Strategy to find the correct Extractor
function from the ExtractorMappings, and subsequently applies the Extractor to the NFT
resolve the value.
