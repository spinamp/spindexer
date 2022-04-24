import { Knex } from 'knex';

import { FactoryContractTypeName } from '../../types/ethereum';
import { MusicPlatform } from '../../types/platform';

const INITIAL_CONTRACTS = [
  {
    id: '0x78e3adc0e811e4f93bd9f1f9389b923c9a3355c2',
    platformId: MusicPlatform.sound,
    startingBlock: '13725566',
    contractType: FactoryContractTypeName.soundArtistProfileCreator,
  },
]

export const up = async (knex: Knex) => {
  console.log('Running create factory contracts bootstrap');
  await knex.schema.createTable('factoryContracts', (table: Knex.CreateTableBuilder) => {
    table.string('id').primary();
    table.string('platformId');
    table.foreign('platformId').references('id').inTable('platforms');
    table.string('startingBlock');
    table.string('contractType');
  });
  await knex('factoryContracts').insert(INITIAL_CONTRACTS);
  await knex.raw(`GRANT SELECT ON "factoryContracts" TO ${process.env.POSTGRES_USERNAME_OPEN}`);
};

exports.down = async (knex: Knex) => {
  await knex.schema.dropTable('factoryContracts');
}
