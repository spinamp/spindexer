import { Table } from '../db/db';
import { Trigger } from '../types/trigger';

export const newIdentities: Trigger<undefined> = async (clients) => {
  const sql = `
    select addresses.address from (
	    (
            select substring(id from 10) as address
            from ${Table.artists} artists 
            where id like 'ethereum/%'
        )
        union
        select id as address
        from ${Table.collectors} 
    ) as addresses
    left outer join ${Table.identities} ids 
    on ids.address = addresses.address
    where ids.address is null
    limit 1000
    `

  const result = await clients.db.rawSQL(sql);
  return result.rows
};
  