const request = require('supertest'),
    app = require('../smbexpress');

describe('smbexpress api', () => {
	describe('GET /status', () => {
		it('respond with status', (done) => {
        request(app)
            .get('/status')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200, done);
    	});
	})
    describe('GET /config', () => {
    	it('respond 200', (done) => {
    		request(app)
    			.get('/config')
    			.set('Accept', 'application/json')
    			.expect(200, done);
    	});
    });
    describe('POST /config', () => {
    	it('respond 200', (done) => {
    		request(app)
    			.post('/config')
    			.expect(200, done);
    	});
    });
});