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
      const message = wallet.sign(JSON.stringify({}))
      const body = {
        msg: message,
        sig: '',
        address: wallet.address,
      }

      supertest(app).post('/').send(body)
        .expect(403)
        .end((err,res) => { if (err) throw err });
    });

    it('returns an error when using an unpermitted address', () => {
      const badWallet = Web3.eth.accounts.create('unpermittedWallet');
      const message = badWallet.sign(JSON.stringify({}))
      const body = {
        msg: message,
        sig: message.signature,
        address: badWallet.address,
      }

      supertest(app).post('/').send(body)
        .expect(403)
        .end((err,res) => { if (err) throw err });

    })
  })

  describe('authenticated', () => {
    describe('platforms', () => {
      const platformsEndpoint = '/v1/seeds/platforms'

      describe('with the incorrect shape', () => {
        it('returns an error', () => {
          const message = wallet.sign(JSON.stringify({ blam: 'yam' }))
          const body = { msg: message, sig: message.signature, address: wallet.address }

          supertest(app).post(platformsEndpoint).send(body)
            .expect(422)
            .end((err,res) => { if (err) throw err });
        })
      })

      describe('with an unknown platform', () => {
        it('returns an error', () => {
          const message = wallet.sign(JSON.stringify({ id: 'potato', name: 'potato', type: 'yum' }))
          const body = { msg: message, sig: message.signature, address: wallet.address }

          supertest(app).post(platformsEndpoint).send(body)
            .expect(422)
            .end((err,res) => { if (err) throw err });
        })
      })

      describe('with a valid payload', () => {
        it('adds the platform', () => {
          const message = wallet.sign(JSON.stringify({ id: 'jamboni', name: 'Jamboni Jams', type: MusicPlatformType.sound }));
          const body = { msg: message, sig: message.signature, address: wallet.address }

          supertest(app).post(platformsEndpoint).send(body)
            .expect(200)
            .end((err,res) => { if (err) throw err });
        })
      })
    })
  })
})
