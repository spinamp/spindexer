import { Table } from '../db/db';
import { FailedAudioExtractionError } from '../types/error';
import { Trigger } from '../types/trigger';

const NUMBER_OF_RETRIES = parseInt(process.env.NUMBER_OF_ERROR_RETRIES!);

export const errorRetry: Trigger<undefined> = async (clients) => {
  const errorQuery = `select *
  from "${Table.nftProcessErrors}"
  where ("numberOfRetries" < '${NUMBER_OF_RETRIES}' or "numberOfRetries" is null)
  and (age(now(), "lastRetry") >= make_interval(mins => cast(pow(coalesce("numberOfRetries", 0), 3) as int)) or "lastRetry" is null)
  limit ${parseInt(process.env.QUERY_TRIGGER_BATCH_SIZE!)}
`
  const errors = (await clients.db.rawSQL(errorQuery))
    .rows.slice(0, parseInt(process.env.QUERY_TRIGGER_BATCH_SIZE!));

  return errors;

};

// This trigger queries all sound-protocol nfts which failed audio extraction. The assumption
// is that they are still in premint phase, and that their animation_url for the audio
// will be filled in within a few days.
export const soundPremintErrors: Trigger<undefined> = async (clients) => {

  const query = `
    select ${Table.nftProcessErrors}.*, ${Table.nfts}."contractAddress"
    from ${Table.nftProcessErrors} join ${Table.nfts}
    on ${Table.nftProcessErrors}."nftId" = ${Table.nfts}.id
    where ${Table.nfts}."platformId" = 'sound-protocol-v1' or
    ${Table.nfts}."platformId" = 'sound' and
    ${Table.nftProcessErrors}."processErrorName" = '${FailedAudioExtractionError.name}';
  `

  const errors = (await clients.db.rawSQL(query)).rows;

  try {
    const contractAddressesSet: Set<string> = new Set(errors.map((e: any) => e.contractAddress));
    const contractAddresses = [...contractAddressesSet]
    const mintTimes = await clients.sound.fetchMintTimes(contractAddresses);

    const errorsToRetry = errors.filter((error: any) => {
      const errorMintTime = mintTimes[error.contractAddress];
      const timeUntilMint = Date.now() / 1000 - errorMintTime;
      // retry for 48 hours after mint
      if (timeUntilMint > 0 && timeUntilMint < 172800) {
        return true
      }
      return false
    })
    return errorsToRetry
  }
  catch (e) {
    return [];
  }
};
