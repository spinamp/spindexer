import assert from 'assert';

import { ethereumAddressFromId } from '../../src/utils/identifiers';
import { TEST_ADMIN_WALLET } from '../pretest';

describe('identifiers', () => {
  describe('ethereumAddressFromId', () => {
    const address = TEST_ADMIN_WALLET.address;

    describe('with invalid ids', () => {
      const invalidIds = [
        '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', // P2PKH
        '347N1Thc213QqfYCz3PZkjoJpNv5b14kBd', // P2SH
        'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq', // Bech32
        '8LzDMxDgTKYz9DrzqnpGee3SGa89up3a227ypMj2xrqM', // Solana
        'noizd/22ebf011-4a64-416a-bc9f-d0aaab658d25', // Noizd pre-release
        '0x00', // too short
        '0x00000000000000000000000000000000000000000', // too long
        undefined,
      ]

      it('returns undefined', () => {
        invalidIds.forEach((input) => {
          assert.equal(ethereumAddressFromId(input as any), undefined, `ethereumAddressFromId(${input}) should return undefined, not '${ethereumAddressFromId(input as any)}'`);
        })
      })
    });

    describe('with valid ids', () => {
      const resolvableIds = [
        `ethereum/${address}`,
        `noizd/${address}`,
        `${address}`
      ]

      it('returns the address ', () => {
        resolvableIds.forEach((input) => {
          assert.equal(ethereumAddressFromId(input), address, `ethereumAddressFromId(${input}) should return '${address}', not '${ethereumAddressFromId(input)}'`);
        })
      })
    });
  })
})
