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
          const body = { entity: 'platforms', data: { id: 'potato', name: 'potato', type: 'yum' } }
          const signature = wallet.sign(JSON.stringify(body)).signature

          supertest(app).post(endpoint).send(body)
            .set('x-signature', signature)
            .expect(422, { error: 'not a valid platforms type' })
            .end((err,res) => { if (err) throw err });
        })
      })

      describe('with unsupported fields', () => {
        it('returns an error', () => {
          const body = { entity: 'platforms', data: { id: 'potato', name: 'potato', type: 'sound', hackyou: 'boo' } }
          const signature = wallet.sign(JSON.stringify(body)).signature

          supertest(app).post(endpoint).send(body)
            .set('x-signature', signature)
            .expect(422, { error: 'platforms entity has unsupported fields' })
            .end((err,res) => { if (err) throw err });
        })
      })

      describe('with a valid payload', () => {
        it('returns a 200', () => {
          const body = { entity: 'platforms', data: { id: 'jamboni', name: 'Jamboni Jams', type: 'sound' } }
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
            data: { id: '1', platformId: 'jamboni', contractType: 'UNKNOWN', standard: 'standard', autoApprove: false, approved: false }
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
            data: { id: '1', platformId: 'jamboni', contractType: 'default', standard: 'UNKNOWN', autoApprove: false, approved: false }
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
            data: { id: '1', platformId: 'jamboni', name: 'lala', contractType: 'default', standard: 'erc721', autoApprove: false, approved: false, hackyou: 'boo' }
          }
          const signature = wallet.sign(JSON.stringify(body)).signature;

          supertest(app).post(endpoint).send(body)
            .set('x-signature', signature)
            .expect(422, { error: 'nftFactories entity has unsupported fields' })
            .end((err,res) => { if (err) throw err });
        })
      })

      describe('with a valid payload', () => {
        it('returns a 200', () => {
          const body = {
            entity: 'nftFactories',
            data: { id: '1', platformId: 'jamboni', name: 'lala', contractType: 'default', standard: 'erc721', autoApprove: false, approved: false }
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

    describe('artistProfiles', () => {
      describe('with the incorrect shape', () => {
        it('returns an error', () => {
          const body = { entity: 'artistProfiles', data: { blam: 'yam' } };
          const signature = wallet.sign(JSON.stringify(body)).signature

          supertest(app).post(endpoint).send(body)
            .set('x-signature', signature)
            .expect(422, { error: 'artistProfiles entity is missing required fields' })
            .end((err,res) => { if (err) throw err });
        })
      })

      describe('with unsupported fields', () => {
        it('returns an error', () => {
          const body = {
            entity: 'artistProfiles',
            data: { artistId: '1', platformId: 'jamboni', name: 'Jammed Jams', hackyou: 'boo' }
          }
          const signature = wallet.sign(JSON.stringify(body)).signature;

          supertest(app).post(endpoint).send(body)
            .set('x-signature', signature)
            .expect(422, { error: 'artistProfiles entity has unsupported fields' })
            .end((err,res) => { if (err) throw err });
        })
      })

      describe('with a valid payload', () => {
        it('returns a 200', () => {
          const body = {
            entity: 'artistProfiles',
            data: { artistId: '1', platformId: 'jamboni', name: 'Jammed Jams' }
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
            data: { artistId: '1', platformId: 'jamboni', title: 'Jammed Jams', hackyou: 'boo' }
          }
          const signature = wallet.sign(JSON.stringify(body)).signature;

          supertest(app).post(endpoint).send(body)
            .set('x-signature', signature)
            .expect(422, { error: 'processedTracks entity has unsupported fields' })
            .end((err,res) => { if (err) throw err });
        })
      })

      describe('with a valid payload', () => {
        it('returns a 200', () => {
          const body = {
            entity: 'processedTracks',
            data: { artistId: '1', platformId: 'jamboni', title: 'Jammed Jams' }
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
