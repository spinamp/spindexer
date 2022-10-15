import supertest from 'supertest';
import web3 from 'web3';

import { createSeedsAPIServer } from '../../src/seeds/server';
import { TEST_ADMIN_WALLET } from '../pretest';

const throwDBHint = (err: any) => { throw new Error(`${err.message}\nHINT: tests run against dev DB. Ensure that DB running, migrated, and working as expected`) };

describe('Seeds API server', () => {
  let app: any;
  const Web3 = new web3();
  const wallet = Web3.eth.accounts.privateKeyToAccount(TEST_ADMIN_WALLET.privateKey);

  before(() => {
    app = createSeedsAPIServer();
  });

  describe('un-authenticated', () => {
    it('returns an error without a signature', () => {
      supertest(app).post('/').send({})
        .expect(403)
        .end((err,res) => { if (err) throw err });
    });

    it('returns an error when using an unpermitted address', () => {
      const body = {};
      const badWallet = Web3.eth.accounts.create('unpermittedWallet');
      const signature = badWallet.sign(JSON.stringify(body)).signature;

      supertest(app).post('/').send(body)
        .set('x-signature', signature)
        .expect(403)
        .end((err,res) => { if (err) throw err });
    })
  })

  describe('authenticated', () => {
    const endpoint = '/v1/seeds'

    describe('an unsupported seed entity', () => {
      it('returns an error', () => {
        const body = { entity: 'crypto-dollars', operation: 'upsert', data: { gimme: 'some' } };
        const signature = wallet.sign(JSON.stringify(body)).signature;

        supertest(app).post(endpoint).send(body)
          .set('x-signature', signature)
          .expect(422, { error: 'unknown seed entity' })
          .end((err,res) => { if (err) throw err });
      })
    })

    describe('an invalid operation', () => {
      it('returns an error', () => {
        const body = { entity: 'platforms', operation: 'delete', data: { gimme: 'some' } };
        const signature = wallet.sign(JSON.stringify(body)).signature;

        supertest(app).post(endpoint).send(body)
          .set('x-signature', signature)
          .expect(422, { error: 'must specify either `upsert` or `update` operation' })
          .end((err,res) => { if (err) throw err });
      })
    })

    describe('platforms', () => {
      const validData = { id: 'jamboni', name: 'Jamboni Jams', type: 'sound' };

      describe('upsert', () => {
        const validUpsert = { entity: 'platforms', operation: 'upsert', data: validData };

        describe('without a required field', () => {
          it('returns an error', () => {
            const { 'name': remove, ...rest } = validData;
            const body = { ...validUpsert, data: { ...rest } };
            const signature = wallet.sign(JSON.stringify(body)).signature;

            supertest(app).post(endpoint).send(body)
              .set('x-signature', signature)
              .expect(422, { error: 'platforms entity is missing required fields' })
              .end((err,res) => { if (err) throw err });
          })
        })

        describe('with an unknown type', () => {
          it('returns an error', () => {
            const body = { ...validUpsert, data: { ...validData, type: 'yum' } };
            const signature = wallet.sign(JSON.stringify(body)).signature;

            supertest(app).post(endpoint).send(body)
              .set('x-signature', signature)
              .expect(422, { error: 'not a valid platforms type' })
              .end((err,res) => { if (err) throw err });
          })
        })

        describe('with unsupported fields', () => {
          it('returns an error', () => {
            const body = { ...validUpsert, data: { ...validData, hackyou: 'boo' } };
            const signature = wallet.sign(JSON.stringify(body)).signature;

            supertest(app).post(endpoint).send(body)
              .set('x-signature', signature)
              .expect(422, { error: 'platforms entity has unsupported fields' })
              .end((err,res) => { if (err) throw err });
          })
        })

        describe('with a valid payload', () => {
          it('returns a 200', async () => {
            const body = validUpsert;
            const signature = wallet.sign(JSON.stringify(body)).signature;

            supertest(app).post(endpoint).send(body)
              .set('x-signature', signature)
              .expect(200)
              .end((err,res) => { if (err) { throwDBHint(err) } });
          })
          it('persists the seed');
        })
      })

      describe('update', () => {
        const validUpdate = { entity: 'platforms', operation: 'update', data: validData };

        describe('without a required field', () => {
          it('returns an error', () => {
            const { 'id': remove, ...rest } = validData;
            const body = { ...validUpdate, data: { ...rest } };
            const signature = wallet.sign(JSON.stringify(body)).signature;

            supertest(app).post(endpoint).send(body)
              .set('x-signature', signature)
              .expect(422, { error: 'platforms entity is missing required fields' })
              .end((err,res) => { if (err) throw err });
          })
        })

        describe('with an unknown type', () => {
          it('returns an error', () => {
            const body = { ...validUpdate, data: { ...validData, type: 'yum' } };
            const signature = wallet.sign(JSON.stringify(body)).signature;

            supertest(app).post(endpoint).send(body)
              .set('x-signature', signature)
              .expect(422, { error: 'not a valid platforms type' })
              .end((err,res) => { if (err) throw err });
          })
        })

        describe('with unsupported fields', () => {
          it('returns an error', () => {
            const body = { ...validUpdate, data: { ...validData, hackyou: 'boo' } };
            const signature = wallet.sign(JSON.stringify(body)).signature;

            supertest(app).post(endpoint).send(body)
              .set('x-signature', signature)
              .expect(422, { error: 'platforms entity has unsupported fields' })
              .end((err,res) => { if (err) throw err });
          })
        })

        describe('with a valid and complete payload', () => {
          it('returns a 200', async () => {
            const body = validUpdate;
            const signature = wallet.sign(JSON.stringify(body)).signature;

            supertest(app).post(endpoint).send(body)
              .set('x-signature', signature)
              .expect(200)
              .end((err,res) => { if (err) { throwDBHint(err) } });
          })
          it('persists the seed');
        })

        describe('with a valid but incomplete payload', () => {
          it('returns a 200', async () => {
            const { 'type': remove, ...rest } = validData;
            const body = { ...validUpdate, data: rest };
            const signature = wallet.sign(JSON.stringify(body)).signature;

            supertest(app).post(endpoint).send(body)
              .set('x-signature', signature)
              .expect(200)
              .end((err,res) => { if (err) { throwDBHint(err) } });
          })
          it('persists the seed');
        })
      })
    })

    describe('nftFactories', () => {
      const validData = { id: '1', startingBlock: '123', platformId: 'jamboni', contractType: 'default', typeMetadata: {}, standard: 'erc721', autoApprove: false, approved: false };

      describe('upsert', () => {
        const validUpsert = { entity: 'nftFactories', operation: 'upsert', data: { ...validData } };

        describe('without a required field', () => {
          it('returns an error', () => {
            const { 'startingBlock': remove, ...rest } = validData;
            const body = { ...validUpsert, data: { ...rest } };
            const signature = wallet.sign(JSON.stringify(body)).signature;

            supertest(app).post(endpoint).send(body)
              .set('x-signature', signature)
              .expect(422, { error: 'nftFactories entity is missing required fields' })
              .end((err,res) => { if (err) throw err });
          })
        })

        describe('with an unknown nftFactories type', () => {
          it('returns an error', () => {
            const body = { ...validUpsert, data: { ...validData, contractType: 'UNKNOWN' } };
            const signature = wallet.sign(JSON.stringify(body)).signature;

            supertest(app).post(endpoint).send(body)
              .set('x-signature', signature)
              .expect(422, { error: 'not a valid nftFactories contractType' })
              .end((err,res) => { if (err) throw err });
          })
        })

        describe('with an unknown standard', () => {
          it('returns an error', () => {
            const body = { ...validUpsert, data: { ...validData, standard: 'UNKNOWN' } };
            const signature = wallet.sign(JSON.stringify(body)).signature;

            supertest(app).post(endpoint).send(body)
              .set('x-signature', signature)
              .expect(422, { error: 'not a valid nftFactories standard' })
              .end((err,res) => { if (err) throw err });
          })
        })

        describe('with unsupported fields', () => {
          it('returns an error', () => {
            const body = { ...validUpsert, data: { ...validData, hackyou: 'boo' } };
            const signature = wallet.sign(JSON.stringify(body)).signature;

            supertest(app).post(endpoint).send(body)
              .set('x-signature', signature)
              .expect(422, { error: 'nftFactories entity has unsupported fields' })
              .end((err,res) => { if (err) throw err });
          })
        })

        describe('with a valid payload', () => {
          it('returns a 200', async () => {
            const body = validUpsert;
            const signature = wallet.sign(JSON.stringify(body)).signature;

            supertest(app).post(endpoint).send(body)
              .set('x-signature', signature)
              .expect(200)
              .end((err,res) => { if (err) throwDBHint(err) });
          })
          it('persists the seed');
        })
      })

      describe('update', () => {
        const validUpdate = { entity: 'nftFactories', operation: 'update', data: { ...validData } };

        describe('without a required field', () => {
          it('returns an error', () => {
            const { 'id': remove, ...rest } = validData;
            const body = { ...validUpdate, data: rest };
            const signature = wallet.sign(JSON.stringify(body)).signature;

            supertest(app).post(endpoint).send(body)
              .set('x-signature', signature)
              .expect(422, { error: 'nftFactories entity is missing required fields' })
              .end((err,res) => { if (err) throw err });
          })
        })

        describe('with an unknown nftFactories type', () => {
          it('returns an error', () => {
            const body = { ...validUpdate, data: { ...validData, contractType: 'UNKNOWN' } };
            const signature = wallet.sign(JSON.stringify(body)).signature;

            supertest(app).post(endpoint).send(body)
              .set('x-signature', signature)
              .expect(422, { error: 'not a valid nftFactories contractType' })
              .end((err,res) => { if (err) throw err });
          })
        })

        describe('with an unknown standard', () => {
          it('returns an error', () => {
            const body = { ...validUpdate, data: { ...validData, standard: 'UNKNOWN' } };
            const signature = wallet.sign(JSON.stringify(body)).signature;

            supertest(app).post(endpoint).send(body)
              .set('x-signature', signature)
              .expect(422, { error: 'not a valid nftFactories standard' })
              .end((err,res) => { if (err) throw err });
          })
        })

        describe('with unsupported fields', () => {
          it('returns an error', () => {
            const body = { ...validUpdate, data: { ...validData, hackyou: 'boo' } };
            const signature = wallet.sign(JSON.stringify(body)).signature;

            supertest(app).post(endpoint).send(body)
              .set('x-signature', signature)
              .expect(422, { error: 'nftFactories entity has unsupported fields' })
              .end((err,res) => { if (err) throw err });
          })
        })

        describe('with a valid but incomplete payload', () => {
          it('returns a 200', async () => {
            const { 'standard': _remove1, 'typeMetadata': _remove2, ...rest } = validData;
            const body = { ...validUpdate, data: rest };
            const signature = wallet.sign(JSON.stringify(body)).signature;

            supertest(app).post(endpoint).send(body)
              .set('x-signature', signature)
              .expect(200)
              .end((err,res) => { if (err) throwDBHint(err) });
          })
          it('persists the seed');
        })

        describe('with a valid payload', () => {
          it('returns a 200', async () => {
            const body = validUpdate;
            const signature = wallet.sign(JSON.stringify(body)).signature;

            supertest(app).post(endpoint).send(body)
              .set('x-signature', signature)
              .expect(200)
              .end((err,res) => { if (err) throwDBHint(err) });
          })
          it('persists the seed');
        })
      })
    })

    describe('artists', () => {
      const validData = { id: '1', name: 'Jammed Jams' };
      const validUpdate = { entity: 'artists', operation: 'update', data: { ...validData } };

      describe('without required fields', () => {
        it('returns an error', () => {
          const body = { ...validUpdate, data: { blam: 'yam' } };
          const signature = wallet.sign(JSON.stringify(body)).signature;

          supertest(app).post(endpoint).send(body)
            .set('x-signature', signature)
            .expect(422, { error: 'artists entity is missing required fields' })
            .end((err,res) => { if (err) throw err });
        })
      })

      describe('with unsupported fields', () => {
        it('returns an error', () => {
          const body = { ...validUpdate, data: { ...validData, hackyou: 'boo' } };
          const signature = wallet.sign(JSON.stringify(body)).signature;

          supertest(app).post(endpoint).send(body)
            .set('x-signature', signature)
            .expect(422, { error: 'artists entity has unsupported fields' })
            .end((err,res) => { if (err) throw err });
        })
      })

      describe('with a valid payload', () => {
        it('returns a 200', async () => {
          const body = validUpdate;
          const signature = wallet.sign(JSON.stringify(body)).signature;

          supertest(app).post(endpoint).send(body)
            .set('x-signature', signature)
            .expect(200)
            .end((err,res) => { if (err) throwDBHint(err) });
        })
        it('persists the seed');
      })
    })

    describe('processedTracks', () => {
      const validData = { id: '1', title: 'Jammed Jams', description: 'Wicked jams!', websiteUrl: 'https://app.spinamp.xyz' };
      const validUpdate = { entity: 'processedTracks', operation: 'update', data: { ...validData } };

      describe('without required fields', () => {
        it('returns an error', () => {
          const body = { ...validUpdate, data: { blam: 'yam' } };
          const signature = wallet.sign(JSON.stringify(body)).signature;

          supertest(app).post(endpoint).send(body)
            .set('x-signature', signature)
            .expect(422, { error: 'processedTracks entity is missing required fields' })
            .end((err,res) => { if (err) throw err });
        })
      })

      describe('with unsupported fields', () => {
        it('returns an error', () => {
          const body = { ...validUpdate, data: { ...validData, hackyou: 'boo' } };
          const signature = wallet.sign(JSON.stringify(body)).signature;

          supertest(app).post(endpoint).send(body)
            .set('x-signature', signature)
            .expect(422, { error: 'processedTracks entity has unsupported fields' })
            .end((err,res) => { if (err) throw err });
        })
      })

      describe('with a valid payload', () => {
        it('returns a 200', async () => {
          const body = validUpdate;
          const signature = wallet.sign(JSON.stringify(body)).signature;

          supertest(app).post(endpoint).send(body)
            .set('x-signature', signature)
            .expect(200)
            .end((err,res) => { if (err) { throwDBHint(err) } });
        })
        it('persists the seed');
      })
    })
  })
})
