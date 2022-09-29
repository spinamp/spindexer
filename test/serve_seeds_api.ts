import * as http from 'http';

import supertest from 'supertest'

describe('Auth', () => {
  let app: http.Server;

  before(() => {
    app = require('../src/serve_seeds_api.ts');
  });

  describe('requests()', () => {
    it('should return error without a signature', (done) => {
      supertest(app).post('/').expect(404, done);
    });
  })
})
