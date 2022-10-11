import supertest from 'supertest'
import web3 from 'web3';

import { MusicPlatformType } from '../src/types/platform';

describe('Seeds API', () => {
  let app: any;
  const Web3 = new web3();

  // TODO: rather stub out the permittedAdminAddresses() to contain this address
  // instead of having to put the known address into .env
  const testAdminWallet = {
    address: '0x8eb97c37B0BDe7A09eA5b49D6D97cd57e10559ba',
    privateKey: '0xe07cc69757e3b261ffeb70df20f832ae74da57e11dd440a5da75377abe8caefc',
  }

  const wallet = Web3.eth.accounts.privateKeyToAccount(testAdminWallet.privateKey)

  // TODO: spin up a test DB instead of using development
  before(() => {
    app = require('../src/serve_seeds_api.ts');
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

    describe('platform', () => {
      describe('with the incorrect shape', () => {
        it('returns an error', () => {
          const body = { entity: 'platform', data: { blam: 'yam' } };
          const signature = wallet.sign(JSON.stringify(body)).signature

          supertest(app).post(endpoint).send(body)
            .set('x-signature', signature)
            .expect(422, { error: 'platform entity is missing required fields' })
            .end((err,res) => { if (err) throw err });
        })
      })

      describe('with unsupported fields', () => {
        it('returns an error');
      })

      describe('with an unknown type', () => {
        it('returns an error', () => {
          const body = { entity: 'platform', data: { id: 'potato', name: 'potato', type: 'yum' } }
          const signature = wallet.sign(JSON.stringify(body)).signature

          supertest(app).post(endpoint).send(body)
            .set('x-signature', signature)
            .expect(422, { error: 'not a valid platform type' })
            .end((err,res) => { if (err) throw err });
        })
      })

      describe('with a valid payload', () => {
        it('returns a 200', () => {
          const body = { entity: 'platform', data: { id: 'jamboni', name: 'Jamboni Jams', type: MusicPlatformType.sound } }
          const signature = wallet.sign(JSON.stringify(body)).signature;

          supertest(app).post(endpoint).send(body)
            .set('x-signature', signature)
            .expect(200)
            .end((err,res) => { if (err) throw err });
        })
        it('persists the seed');
      })
    })

    describe('nftFactory', () => {
      describe('with the incorrect shape', () => {
        it('returns an error', () => {
          const body = { entity: 'nftFactory', data: { blam: 'yam' } };
          const signature = wallet.sign(JSON.stringify(body)).signature

          supertest(app).post(endpoint).send(body)
            .set('x-signature', signature)
            .expect(422, { error: 'nftFactory entity is missing required fields' })
            .end((err,res) => { if (err) throw err });
        })
      })

      describe('with unsupported fields', () => {
        it('returns an error');
      })

      describe('with an unknown nftFactory type', () => {
        it('returns an error', () => {
          const body = {
            entity: 'nftFactory',
            data: { id: '1', platformId: 'jamboni', contractType: 'UNKNOWN', standard: 'standard', autoApprove: false, approved: false }
          }
          const signature = wallet.sign(JSON.stringify(body)).signature

          supertest(app).post(endpoint).send(body)
            .set('x-signature', signature)
            .expect(422, { error: 'not a valid contract type' })
            .end((err,res) => { if (err) throw err });
        })
      })

      describe('with an unknown standard', () => {
        it('returns an error', () => {
          const body = {
            entity: 'nftFactory',
            data: { id: '1', platformId: 'jamboni', contractType: 'default', standard: 'UNKNOWN', autoApprove: false, approved: false }
          }
          const signature = wallet.sign(JSON.stringify(body)).signature

          supertest(app).post(endpoint).send(body)
            .set('x-signature', signature)
            .expect(422, { error: 'not a valid nftFactory standard' })
            .end((err,res) => { if (err) throw err });
        })
      })

      describe('with a valid payload', () => {
        it('returns a 200', () => {
          const body = {
            entity: 'nftFactory',
            data: { id: '1', platformId: 'jamboni', contractType: 'default', standard: 'erc721', autoApprove: false, approved: false }
          }
          const signature = wallet.sign(JSON.stringify(body)).signature;

          supertest(app).post(endpoint).send(body)
            .set('x-signature', signature)
            .expect(200)
            .end((err,res) => { if (err) throw err });
        })
        it('persists the seed');
      })
    })

    describe('artistProfile', () => {
      describe('with the incorrect shape', () => {
        it('returns an error', () => {
          const body = { entity: 'artistProfile', data: { blam: 'yam' } };
          const signature = wallet.sign(JSON.stringify(body)).signature

          supertest(app).post(endpoint).send(body)
            .set('x-signature', signature)
            .expect(422, { error: 'artistProfile entity is missing required fields' })
            .end((err,res) => { if (err) throw err });
        })
      })

      describe('with unsupported fields', () => {
        it('returns an error');
      })

      describe('with a valid payload', () => {
        it('returns a 200', () => {
          const body = {
            entity: 'artistProfile',
            data: { artistId: '1', platformId: 'jamboni', name: 'Jammed Jams' }
          }
          const signature = wallet.sign(JSON.stringify(body)).signature;

          supertest(app).post(endpoint).send(body)
            .set('x-signature', signature)
            .expect(200)
            .end((err,res) => { if (err) throw err });
        })
        it('persists the seed');
      })
    })

    describe('nftProcessedTrack', () => {
      describe('with the incorrect shape', () => {
        it('returns an error', () => {
          const body = { entity: 'nftProcessedTrack', data: { blam: 'yam' } };
          const signature = wallet.sign(JSON.stringify(body)).signature

          supertest(app).post(endpoint).send(body)
            .set('x-signature', signature)
            .expect(422, { error: 'nftProcessedTrack entity is missing required fields' })
            .end((err,res) => { if (err) throw err });
        })
      })

      describe('with unsupported fields', () => {
        it('returns an error');
      })

      describe('with a valid payload', () => {
        it('returns a 200', () => {
          const body = {
            entity: 'nftProcessedTrack',
            data: { artistId: '1', platformId: 'jamboni', name: 'Jammed Jams' }
          }
          const signature = wallet.sign(JSON.stringify(body)).signature;

          supertest(app).post(endpoint).send(body)
            .set('x-signature', signature)
            .expect(200)
            .end((err,res) => { if (err) { throw err } });
        })
        it('persists the seed');
      })
    })
  })
})
