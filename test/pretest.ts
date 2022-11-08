import '../src/types/env';
import 'dotenv/config';

export const TEST_ADMIN_WALLET = {
  address: '0x8eb97c37B0BDe7A09eA5b49D6D97cd57e10559ba',
  privateKey: '0xe07cc69757e3b261ffeb70df20f832ae74da57e11dd440a5da75377abe8caefc',
}

console.log('-------------------------------------');
console.log('configuring tests...');

process.env.PERMITTED_ADMIN_ADDRESSES = TEST_ADMIN_WALLET.address;
process.env.POSTGRES_DATABASE = `spindexer_test`;

console.log(`setting PERMITTED_ADMIN_ADDRESSES...`);
console.log('starting tests...');
console.log('-------------------------------------');
