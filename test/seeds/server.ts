import supertest from 'supertest';
import web3 from 'web3';

import { createSeedsAPIServer } from '../../src/seeds/server';
import { TEST_ADMIN_WALLET } from '../pretest';


const throwDBHint = (err: any) => { throw new Error(`${err.message}\nHINT: tests run against dev DB. Ensure that DB running, migrated, and working as expected`) };

describe('Seeds API server', () => {
  let app: any;
  const Web3 = new web3();
  const adminWallet = Web3.eth.accounts.privateKeyToAccount(TEST_ADMIN_WALLET.privateKey);
  const publicWallet = Web3.eth.accounts.create('publicWallet');
  const endpoint = '/v1/seeds'

  before(() => {
    app = createSeedsAPIServer();
  });

  describe('POST /v1/seeds', () => {
    it('allows an OPTIONS request ', () => {
      supertest(app).options(endpoint).send({})
        .set('Origin', 'https://app.spinamp.xyz')
        .expect(204)
        .expect('Access-Control-Allow-Origin', 'https://app.spinamp.xyz')
        .expect('Access-Control-Allow-Methods', 'POST')
        .end((err,res) => { if (err) throw err});
    })

    describe('missing a signature header', () => {
      it('returns an error', () => {
        supertest(app).post(endpoint).send({})
          .expect(403)
          .end((err,res) => { if (err) throw err });
      });
    });

    describe('an unsupported seed entity', () => {
      it('returns an error', () => {
        const body = { entity: 'crypto-dollars', operation: 'upsert', data: { gimme: 'some' } };
        const signature = adminWallet.sign(JSON.stringify(body)).signature;

        supertest(app).post(endpoint).send(body)
          .set('x-signature', signature)
          .expect(422, { error: 'unknown seed entity' })
          .end((err,res) => { if (err) throw err });
      })
    })

    describe('an invalid operation', () => {
      it('returns an error', () => {
        const body = { entity: 'platforms', operation: 'delete', data: { gimme: 'some' } };
        const signature = adminWallet.sign(JSON.stringify(body)).signature;

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

        describe('using a public wallet', () => {
          it('returns an error', () => {
            const signature = publicWallet.sign(JSON.stringify(validUpsert)).signature;

            supertest(app).post(endpoint).send(validUpsert)
              .set('x-signature', signature)
              .expect(403)
              .end((err,res) => { if (err) throw err });
          })
        })

        describe('without a required field', () => {
          it('returns an error', () => {
            const { 'name': remove, ...rest } = validData;
            const body = { ...validUpsert, data: { ...rest } };
            const signature = adminWallet.sign(JSON.stringify(body)).signature;

            supertest(app).post(endpoint).send(body)
              .set('x-signature', signature)
              .expect(422, { error: 'platforms entity is missing required fields' })
              .end((err,res) => { if (err) throw err });
          })
        })

        describe('with an unknown type', () => {
          it('returns an error', () => {
            const body = { ...validUpsert, data: { ...validData, type: 'yum' } };
            const signature = adminWallet.sign(JSON.stringify(body)).signature;

            supertest(app).post(endpoint).send(body)
              .set('x-signature', signature)
              .expect(422, { error: 'not a valid platforms type' })
              .end((err,res) => { if (err) throw err });
          })
        })

        describe('with unsupported fields', () => {
          it('returns an error', () => {
            const body = { ...validUpsert, data: { ...validData, hackyou: 'boo' } };
            const signature = adminWallet.sign(JSON.stringify(body)).signature;

            supertest(app).post(endpoint).send(body)
              .set('x-signature', signature)
              .expect(422, { error: 'platforms entity has unsupported fields' })
              .end((err,res) => { if (err) throw err });
          })
        })

        describe('with a valid payload', () => {
          it('returns a 200', async () => {
            const body = validUpsert;
            const signature = adminWallet.sign(JSON.stringify(body)).signature;

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

        describe('using a public wallet', () => {
          it('returns an error', () => {
            const signature = publicWallet.sign(JSON.stringify(validUpdate)).signature;

            supertest(app).post(endpoint).send(validUpdate)
              .set('x-signature', signature)
              .expect(403)
              .end((err,res) => { if (err) throw err });
          })
        })

        describe('without a required field', () => {
          it('returns an error', () => {
            const { 'id': remove, ...rest } = validData;
            const body = { ...validUpdate, data: { ...rest } };
            const signature = adminWallet.sign(JSON.stringify(body)).signature;

            supertest(app).post(endpoint).send(body)
              .set('x-signature', signature)
              .expect(422, { error: 'platforms entity is missing required fields' })
              .end((err,res) => { if (err) throw err });
          })
        })

        describe('with an unknown type', () => {
          it('returns an error', () => {
            const body = { ...validUpdate, data: { ...validData, type: 'yum' } };
            const signature = adminWallet.sign(JSON.stringify(body)).signature;

            supertest(app).post(endpoint).send(body)
              .set('x-signature', signature)
              .expect(422, { error: 'not a valid platforms type' })
              .end((err,res) => { if (err) throw err });
          })
        })

        describe('with unsupported fields', () => {
          it('returns an error', () => {
            const body = { ...validUpdate, data: { ...validData, hackyou: 'boo' } };
            const signature = adminWallet.sign(JSON.stringify(body)).signature;

            supertest(app).post(endpoint).send(body)
              .set('x-signature', signature)
              .expect(422, { error: 'platforms entity has unsupported fields' })
              .end((err,res) => { if (err) throw err });
          })
        })

        describe('with a valid and complete payload', () => {
          it('returns a 200', async () => {
            const body = validUpdate;
            const signature = adminWallet.sign(JSON.stringify(body)).signature;

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
            const signature = adminWallet.sign(JSON.stringify(body)).signature;

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
      describe('upsert', () => {
        const validData = { id: '1', startingBlock: '123', platformId: 'jamboni', contractType: 'default', typeMetadata: {}, standard: 'erc721', autoApprove: false, approved: false };
        const validUpsert = { entity: 'nftFactories', operation: 'upsert', data: { ...validData } };

        describe('using a public wallet', () => {
          it('returns an error', () => {
            const signature = publicWallet.sign(JSON.stringify(validUpsert)).signature;

            supertest(app).post(endpoint).send(validUpsert)
              .set('x-signature', signature)
              .expect(403)
              .end((err,res) => { if (err) throw err });
          })
        })

        describe('without a required field', () => {
          it('returns an error', () => {
            const { 'startingBlock': remove, ...rest } = validData;
            const body = { ...validUpsert, data: { ...rest } };
            const signature = adminWallet.sign(JSON.stringify(body)).signature;

            supertest(app).post(endpoint).send(body)
              .set('x-signature', signature)
              .expect(422, { error: 'nftFactories entity is missing required fields' })
              .end((err,res) => { if (err) throw err });
          })
        })

        describe('with an unknown nftFactories type', () => {
          it('returns an error', () => {
            const body = { ...validUpsert, data: { ...validData, contractType: 'UNKNOWN' } };
            const signature = adminWallet.sign(JSON.stringify(body)).signature;

            supertest(app).post(endpoint).send(body)
              .set('x-signature', signature)
              .expect(422, { error: 'not a valid nftFactories contractType' })
              .end((err,res) => { if (err) throw err });
          })
        })

        describe('with an unknown standard', () => {
          it('returns an error', () => {
            const body = { ...validUpsert, data: { ...validData, standard: 'UNKNOWN' } };
            const signature = adminWallet.sign(JSON.stringify(body)).signature;

            supertest(app).post(endpoint).send(body)
              .set('x-signature', signature)
              .expect(422, { error: 'not a valid nftFactories standard' })
              .end((err,res) => { if (err) throw err });
          })
        })

        describe('with unsupported fields', () => {
          it('returns an error', () => {
            const body = { ...validUpsert, data: { ...validData, hackyou: 'boo' } };
            const signature = adminWallet.sign(JSON.stringify(body)).signature;

            supertest(app).post(endpoint).send(body)
              .set('x-signature', signature)
              .expect(422, { error: 'nftFactories entity has unsupported fields' })
              .end((err,res) => { if (err) throw err });
          })
        })

        describe('with a valid payload', () => {
          it('returns a 200', async () => {
            const body = validUpsert;
            const signature = adminWallet.sign(JSON.stringify(body)).signature;

            supertest(app).post(endpoint).send(body)
              .set('x-signature', signature)
              .expect(200)
              .end((err,res) => { if (err) throwDBHint(err) });
          })
          it('persists the seed');
        })
      })

      describe('update', () => {
        const validData = { id: '1', autoApprove: false, approved: false };
        const validUpdate = { entity: 'nftFactories', operation: 'update', data: { ...validData } };

        describe('using a public wallet', () => {
          it('returns an error', () => {
            const signature = publicWallet.sign(JSON.stringify(validUpdate)).signature;

            supertest(app).post(endpoint).send(validUpdate)
              .set('x-signature', signature)
              .expect(403)
              .end((err,res) => { if (err) throw err });
          })
        })

        describe('without a required field', () => {
          it('returns an error', () => {
            const { 'id': remove, ...rest } = validData;
            const body = { ...validUpdate, data: rest };
            const signature = adminWallet.sign(JSON.stringify(body)).signature;

            supertest(app).post(endpoint).send(body)
              .set('x-signature', signature)
              .expect(422, { error: 'nftFactories entity is missing required fields' })
              .end((err,res) => { if (err) throw err });
          })
        })

        describe('with unsupported fields', () => {
          it('returns an error', () => {
            const body = { ...validUpdate, data: { ...validData, hackyou: 'boo' } };
            const signature = adminWallet.sign(JSON.stringify(body)).signature;

            supertest(app).post(endpoint).send(body)
              .set('x-signature', signature)
              .expect(422, { error: 'nftFactories entity has unsupported fields' })
              .end((err,res) => { if (err) throw err });
          })
        })

        describe('with a valid but incomplete payload', () => {
          it('returns a 200', async () => {
            const { 'approved': _remove1, ...rest } = validData;
            const body = { ...validUpdate, data: rest };
            const signature = adminWallet.sign(JSON.stringify(body)).signature;

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
            const signature = adminWallet.sign(JSON.stringify(body)).signature;

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

      describe('update', () => {
        const validUpdate = { entity: 'artists', operation: 'update', data: { ...validData } };

        describe('using a public wallet', () => {
          it('returns an error', () => {
            const signature = publicWallet.sign(JSON.stringify(validUpdate)).signature;

            supertest(app).post(endpoint).send(validUpdate)
              .set('x-signature', signature)
              .expect(403)
              .end((err,res) => { if (err) throw err });
          })
        })

        describe('without a required field', () => {
          it('returns an error', () => {
            const { 'id': remove, ...rest } = validData;
            const body = { ...validUpdate, data: rest };
            const signature = adminWallet.sign(JSON.stringify(body)).signature;

            supertest(app).post(endpoint).send(body)
              .set('x-signature', signature)
              .expect(422, { error: 'artists entity is missing required fields' })
              .end((err,res) => { if (err) throw err });
          })
        })

        describe('with unsupported fields', () => {
          it('returns an error', () => {
            const body = { ...validUpdate, data: { ...validData, hackyou: 'boo' } };
            const signature = adminWallet.sign(JSON.stringify(body)).signature;

            supertest(app).post(endpoint).send(body)
              .set('x-signature', signature)
              .expect(422, { error: 'artists entity has unsupported fields' })
              .end((err,res) => { if (err) throw err });
          })
        })

        describe('with a payload only containing an id', () => {
          it('returns a 422', async () => {
            const { 'name': _remove, ...rest } = validData;
            const body = { ...validUpdate, data: rest };
            const signature = adminWallet.sign(JSON.stringify(body)).signature;

            supertest(app).post(endpoint).send(body)
              .set('x-signature', signature)
              .expect(422, { error: 'At least one non-id field is needed in the payload' })
              .end((err,res) => { if (err) throwDBHint(err) });
          })
          it('persists the seed');
        })

        describe('with a valid payload', () => {
          it('returns a 200', async () => {
            const body = validUpdate;
            const signature = adminWallet.sign(JSON.stringify(body)).signature;

            supertest(app).post(endpoint).send(body)
              .set('x-signature', signature)
              .expect(200)
              .end((err,res) => { if (err) throwDBHint(err) });
          })
          it('persists the seed');
        })
      })

      describe('upsert', () => {
        const payload = { entity: 'artists', operation: 'upsert', data: { ...validData } };

        it('returns an error', () => {
          const signature = adminWallet.sign(JSON.stringify(payload)).signature;

          supertest(app).post(endpoint).send(payload)
            .set('x-signature', signature)
            .expect(422, { error: 'Artist upsert not supported' })
            .end((err,res) => { if (err) throw err });
        })
      })
    })

    describe('processedTracks', () => {
      const validData = { id: '1', title: 'Jammed Jams', description: 'Wicked jams!', websiteUrl: 'https://app.spinamp.xyz' };

      describe ('update',() => {
        const validUpdate = { entity: 'processedTracks', operation: 'update', data: { ...validData } };

        describe('using a public wallet', () => {
          it('returns an error', () => {
            const signature = publicWallet.sign(JSON.stringify(validUpdate)).signature;

            supertest(app).post(endpoint).send(validUpdate)
              .set('x-signature', signature)
              .expect(403)
              .end((err,res) => { if (err) throw err });
          })
        })

        describe('without required fields', () => {
          it('returns an error', () => {
            const body = { ...validUpdate, data: { blam: 'yam' } };
            const signature = adminWallet.sign(JSON.stringify(body)).signature;

            supertest(app).post(endpoint).send(body)
              .set('x-signature', signature)
              .expect(422, { error: 'processedTracks entity is missing required fields' })
              .end((err,res) => { if (err) throw err });
          })
        })

        describe('with unsupported fields', () => {
          it('returns an error', () => {
            const body = { ...validUpdate, data: { ...validData, hackyou: 'boo' } };
            const signature = adminWallet.sign(JSON.stringify(body)).signature;

            supertest(app).post(endpoint).send(body)
              .set('x-signature', signature)
              .expect(422, { error: 'processedTracks entity has unsupported fields' })
              .end((err,res) => { if (err) throw err });
          })
        })

        describe('with a valid but incomplete payload', () => {
          it('returns a 200', async () => {
            const { 'title': _remove1, 'websiteUrl': _remove2, ...rest } = validData;
            const body = { ...validUpdate, data: rest };
            const signature = adminWallet.sign(JSON.stringify(body)).signature;

            supertest(app).post(endpoint).send(body)
              .set('x-signature', signature)
              .expect(200)
              .end((err,res) => { if (err) { throwDBHint(err) } });
          })
          it('persists the seed');
        })

        describe('with a valid payload', () => {
          it('returns a 200', async () => {
            const body = validUpdate;
            const signature = adminWallet.sign(JSON.stringify(body)).signature;

            supertest(app).post(endpoint).send(body)
              .set('x-signature', signature)
              .expect(200)
              .end((err,res) => { if (err) { throwDBHint(err) } });
          })
          it('persists the seed');
        })
      })

      describe('upsert', () => {
        const payload = { entity: 'processedTracks', operation: 'upsert', data: { ...validData } };

        it('returns an error', () => {
          const signature = adminWallet.sign(JSON.stringify(payload)).signature;

          supertest(app).post(endpoint).send(payload)
            .set('x-signature', signature)
            .expect(422, { error: 'Track upsert not supported' })
            .end((err,res) => { if (err) throw err });
        })
      })
    })

    // describe('POST /v1/zora_approval', () => {
    //   describe('nftFactories', () => {
    //     let dbClient;

    //     before( async () => {
    //       dbClient = await db.init();
    //       await dbClient.insert(Table.platforms, [ZORA_LATEST_PLATFORM] );
    //     })

    //     describe('update', () => {
    //       const validId = '0x78fb0b8d4502ae69a61c0d0321141629553472bd';
    //       const validData = { id: validId, autoApprove: false, approved: false };
    //       const validUpdate = { entity: 'nftFactories', operation: 'update', data: { ...validData } };

    //       describe('without a required field', () => {
    //         it('returns an error', () => {
    //           const { 'id': remove, ...rest } = validData;
    //           const body = { ...validUpdate, data: rest };
    //           const signature = adminWallet.sign(JSON.stringify(body)).signature;

    //           supertest(app).post(endpoint).send(body)
    //             .set('x-signature', signature)
    //             .expect(422, { error: 'nftFactories entity is missing required fields' })
    //             .end((err,res) => { if (err) throw err });
    //         })
    //       })

    //       describe('with unsupported fields', () => {
    //         it('returns an error', () => {
    //           const body = { ...validUpdate, data: { ...validData, hackyou: 'boo' } };
    //           const signature = adminWallet.sign(JSON.stringify(body)).signature;

    //           supertest(app).post(endpoint).send(body)
    //             .set('x-signature', signature)
    //             .expect(422, { error: 'nftFactories entity has unsupported fields' })
    //             .end((err,res) => { if (err) throw err });
    //         })
    //       })

    //       describe('with a valid but incomplete payload', () => {
    //         it('returns a 200', async () => {
    //           const { 'approved': _remove1, ...rest } = validData;
    //           const body = { ...validUpdate, data: rest };
    //           const signature = adminWallet.sign(JSON.stringify(body)).signature;

    //           supertest(app).post(endpoint).send(body)
    //             .set('x-signature', signature)
    //             .expect(200)
    //             .end((err,res) => { if (err) throwDBHint(err) });
    //         })
    //         it('persists the seed');
    //       })

    //       describe('with a valid payload', () => {
    //         it('returns a 200', async () => {
    //           const body = validUpdate;
    //           const signature = adminWallet.sign(JSON.stringify(body)).signature;

    //           supertest(app).post(endpoint).send(body)
    //             .set('x-signature', signature)
    //             .expect(200)
    //             .end((err,res) => { if (err) throwDBHint(err) });
    //         })
    //         it('persists the seed');
    //       })
    //     })
    //   })
    // })
  })
})
