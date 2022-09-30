import supertest from 'supertest'
import web3 from 'web3';

import { MusicPlatformType } from '../src/types/platform';

describe('Seeds API', () => {
  let app: any;
  const Web3 = new web3();
  const wallet = Web3.eth.accounts.create('seedAdminWallet');

  // TODO: spin up a test DB instead of using development
  before(() => {
    app = require('../src/serve_seeds_api.ts');
  });

  describe('un-authenticated', () => {
    it('returns an error without a signature', (done) => {
      const message = wallet.sign(JSON.stringify({}))
      const body = {
        msg: message,
        sig: '',
        address: wallet.address,
      }

      supertest(app).post('/').send(body)
        .expect(403, done);
    });
  })

  describe('authenticated', () => {
    describe('platforms', () => {
      const platformsEndpoint = '/v1/seeds/platforms'

      describe('with the incorrect shape', () => {
        it('returns an error', (done) => {
          const message = wallet.sign(JSON.stringify({ blam: 'yam' }))
          const body = { msg: message, sig: message.signature, address: wallet.address }

          supertest(app).post(platformsEndpoint).send(body)
            .expect(422, done);
        })
      })

      describe('with an unknown platform', () => {
        it('returns an error', (done) => {
          const message = wallet.sign(JSON.stringify({ id: 'potato', name: 'potato', type: 'yum' }))
          const body = { msg: message, sig: message.signature, address: wallet.address }

          supertest(app).post(platformsEndpoint).send(body)
            .expect(422, done);
        })
      })

      describe('with a valid payload', () => {
        it('adds the platform', (done) => {
          const message = wallet.sign(JSON.stringify({ id: 'jamboni', name: 'Jamboni Jams', type: MusicPlatformType.sound }));
          const body = { msg: message, sig: message.signature, address: wallet.address }

          supertest(app).post(platformsEndpoint).send(body)
            .expect(200, done);
        })
      })
    })
  })
})
