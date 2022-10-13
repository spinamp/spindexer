import supertest from 'supertest'
import web3 from 'web3';

import { createSeedsAPIServer } from '../../src/seeds/server';
import { TEST_ADMIN_WALLET } from '../pretest';

const throwDBHint = (err: any) => { throw new Error(`${err.message}\nHINT: tests run against dev DB. Ensure that DB running, migrated, and working as expected`) };

describe('Seeds API server', () => {
  let app: any;
  const Web3 = new web3();
  const wallet = Web3.eth.accounts.privateKeyToAccount(TEST_ADMIN_WALLET.privateKey)

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
      const body = {}
      const badWallet = Web3.eth.accounts.create('unpermittedWallet');
      const signature = badWallet.sign(JSON.stringify(body)).signature

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
        const body = { entity: 'crypto-dollars', data: { gimme: 'some' } };
        const signature = wallet.sign(JSON.stringify(body)).signature

        supertest(app).post(endpoint).send(body)
          .set('x-signature', signature)
          .expect(422, { error: 'unknown seed entity' })
          .end((err,res) => { if (err) throw err });
      })
    })

    describe('platforms', () => {
      const validData = { id: 'jamboni', name: 'Jamboni Jams', type: 'sound' };

      describe('with the incorrect shape', () => {
        it('returns an error', () => {
          const body = { entity: 'platforms', data: { blam: 'yam' } };
          const signature = wallet.sign(JSON.stringify(body)).signature

          supertest(app).post(endpoint).send(body)
            .set('x-signature', signature)
            .expect(422, { error: 'platforms entity is missing required fields' })
            .end((err,res) => { if (err) throw err });
        })
      })

      describe('with an unknown type', () => {
        it('returns an error', () => {
          const body = { entity: 'platforms', data: { ...validData, type: 'yum' } }
          const signature = wallet.sign(JSON.stringify(body)).signature

          supertest(app).post(endpoint).send(body)
            .set('x-signature', signature)
            .expect(422, { error: 'not a valid platforms type' })
            .end((err,res) => { if (err) throw err });
        })
      })

      describe('with unsupported fields', () => {
        it('returns an error', () => {
          const body = { entity: 'platforms', data: { ...validData, hackyou: 'boo' } }
          const signature = wallet.sign(JSON.stringify(body)).signature

          supertest(app).post(endpoint).send(body)
            .set('x-signature', signature)
            .expect(422, { error: 'platforms entity has unsupported fields' })
            .end((err,res) => { if (err) throw err });
        })
      })

      describe('with a valid payload', () => {
        it('returns a 200', async () => {
          const body = { entity: 'platforms', data: validData }
          const signature = wallet.sign(JSON.stringify(body)).signature;

          supertest(app).post(endpoint).send(body)
            .set('x-signature', signature)
            .expect(200)
            .end((err,res) => { if (err) { throwDBHint(err) } });
        })
        it('persists the seed');
      })
    })

    describe('nftFactories', () => {
      const validData = { id: '1', startingBlock: '123', platformId: 'jamboni', contractType: 'default', name: 'jambori', symbol: 'JAM', typeMetadata: {}, standard: 'erc721', autoApprove: false, approved: false };

      describe('with the incorrect shape', () => {
        it('returns an error', () => {
          const body = { entity: 'nftFactories', data: { blam: 'yam' } };
          const signature = wallet.sign(JSON.stringify(body)).signature

          supertest(app).post(endpoint).send(body)
            .set('x-signature', signature)
            .expect(422, { error: 'nftFactories entity is missing required fields' })
            .end((err,res) => { if (err) throw err });
        })
      })

      describe('with an unknown nftFactories type', () => {
        it('returns an error', () => {
          const body = {
            entity: 'nftFactories',
            data: { ...validData, contractType: 'UNKNOWN' }
          }
          const signature = wallet.sign(JSON.stringify(body)).signature

          supertest(app).post(endpoint).send(body)
            .set('x-signature', signature)
            .expect(422, { error: 'not a valid nftFactories contractType' })
            .end((err,res) => { if (err) throw err });
        })
      })

      describe('with an unknown standard', () => {
        it('returns an error', () => {
          const body = {
            entity: 'nftFactories',
            data: { ...validData, standard: 'UNKNOWN' }
          }
          const signature = wallet.sign(JSON.stringify(body)).signature

          supertest(app).post(endpoint).send(body)
            .set('x-signature', signature)
            .expect(422, { error: 'not a valid nftFactories standard' })
            .end((err,res) => { if (err) throw err });
        })
      })

      describe('with unsupported fields', () => {
        it('returns an error', () => {
          const body = {
            entity: 'nftFactories',
            data: { ...validData, hackyou: 'boo' },
          }
          const signature = wallet.sign(JSON.stringify(body)).signature;

          supertest(app).post(endpoint).send(body)
            .set('x-signature', signature)
            .expect(422, { error: 'nftFactories entity has unsupported fields' })
            .end((err,res) => { if (err) throw err });
        })
      })

      describe('with a valid payload', () => {
        it('returns a 200', async () => {
          const body = {
            entity: 'nftFactories',
            data: validData
          }
          const signature = wallet.sign(JSON.stringify(body)).signature;

          supertest(app).post(endpoint).send(body)
            .set('x-signature', signature)
            .expect(200)
            .end((err,res) => { if (err) throwDBHint(err) });
        })
        it('persists the seed');
      })
    })

    describe('artists', () => {
      const validData = { id: '1', name: 'Jammed Jams' };

      describe('with the incorrect shape', () => {
        it('returns an error', () => {
          const body = { entity: 'artists', data: { blam: 'yam' } };
          const signature = wallet.sign(JSON.stringify(body)).signature

          supertest(app).post(endpoint).send(body)
            .set('x-signature', signature)
            .expect(422, { error: 'artists entity is missing required fields' })
            .end((err,res) => { if (err) throw err });
        })
      })

      describe('with unsupported fields', () => {
        it('returns an error', () => {
          const body = {
            entity: 'artists',
            data: { ...validData, hackyou: 'boo' }
          }
          const signature = wallet.sign(JSON.stringify(body)).signature;

          supertest(app).post(endpoint).send(body)
            .set('x-signature', signature)
            .expect(422, { error: 'artists entity has unsupported fields' })
            .end((err,res) => { if (err) throw err });
        })
      })

      describe('with a valid payload', () => {
        it('returns a 200', async () => {
          const body = {
            entity: 'artists',
            data: validData
          }
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
      const validData = { id: '1', title: 'Jammed Jams', description: 'Wicked jams!' }

      describe('with the incorrect shape', () => {
        it('returns an error', () => {
          const body = { entity: 'processedTracks', data: { blam: 'yam' } };
          const signature = wallet.sign(JSON.stringify(body)).signature

          supertest(app).post(endpoint).send(body)
            .set('x-signature', signature)
            .expect(422, { error: 'processedTracks entity is missing required fields' })
            .end((err,res) => { if (err) throw err });
        })
      })

      describe('with unsupported fields', () => {
        it('returns an error', () => {
          const body = {
            entity: 'processedTracks',
            data: { ...validData, hackyou: 'boo' }
          }
          const signature = wallet.sign(JSON.stringify(body)).signature;

          supertest(app).post(endpoint).send(body)
            .set('x-signature', signature)
            .expect(422, { error: 'processedTracks entity has unsupported fields' })
            .end((err,res) => { if (err) throw err });
        })
      })

      describe('with a valid payload', () => {
        it('returns a 200', async () => {
          const body = {
            entity: 'processedTracks',
            data: validData
          }
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
