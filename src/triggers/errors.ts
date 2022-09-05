import { Table } from '../db/db';
import { Trigger } from '../types/trigger';

const NUMBER_OF_RETRIES = parseInt(process.env.NUMBER_OF_ERROR_RETRIES!);

export const errorRetry: Trigger<undefined> = async (clients) => {
  const errorQuery = `select *
  from "${Table.nftProcessErrors}"
  where ("numberOfRetries" < '${NUMBER_OF_RETRIES}' or "numberOfRetries" is null)
  and (age(now(), "lastRetry") >= make_interval(mins => cast(exp("numberOfRetries") as int))  or "lastRetry" is null)
  limit ${parseInt(process.env.QUERY_TRIGGER_BATCH_SIZE!)}
`
  const errors = (await clients.db.rawSQL(errorQuery))
    .rows.slice(0, parseInt(process.env.QUERY_TRIGGER_BATCH_SIZE!));

  return errors;

};
