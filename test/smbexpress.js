const request = require('supertest'),
    app = require('../smbexpress');

describe('GET /status', () => {
    it('respond with json', (done) => {
        request(app)
            .get('/status')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200, done);
    });
});