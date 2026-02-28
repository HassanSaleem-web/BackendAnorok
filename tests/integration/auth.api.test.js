const request = require('supertest');
const app = require('../../app');
const User = require('../../models/User');

describe('Auth API Integration Tests', () => {
    const testUser = {
        fullName: 'API Test User',
        email: 'api.test@example.com',
        password: 'Password123!'
    };

    let authToken;

    describe('POST /api/auth/signup', () => {
        it('should correctly register a new user and set a JWT cookie', async () => {
            const res = await request(app)
                .post('/api/auth/signup')
                .send(testUser)
                .expect(201);

            expect(res.body.user).toBeDefined();
            expect(res.body.user.email).toBe(testUser.email);
            expect(res.body.token).toBeDefined();

            // Check that Set-Cookie header exists
            const cookies = res.headers['set-cookie'];
            expect(cookies).toBeDefined();
            expect(cookies[0]).toMatch(/jwt=/);
        });

        it('should reject a duplicate email signup', async () => {
            // Seed the database with the first user
            await request(app).post('/api/auth/signup').send(testUser);

            // Attempt to sign up identically
            const res = await request(app)
                .post('/api/auth/signup')
                .send(testUser)
                .expect(409);

            expect(res.body.error).toMatch(/already exists/i);
        });
    });

    describe('POST /api/auth/login', () => {
        beforeEach(async () => {
            // Seed the user so there is someone to log in
            await request(app).post('/api/auth/signup').send(testUser);
        });

        it('should correctly log in user and set a JWT cookie', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password
                })
                .expect(200);

            expect(res.body.user).toBeDefined();
            expect(res.body.token).toBeDefined();
            authToken = res.body.token;

            const cookies = res.headers['set-cookie'];
            expect(cookies).toBeDefined();
            expect(cookies[0]).toMatch(/jwt=/);
        });
    });

    describe('GET /api/auth/me', () => {
        beforeEach(async () => {
            // Seed user and capture fresh login token
            const res = await request(app).post('/api/auth/signup').send(testUser);
            authToken = res.body.token;
        });

        it('should fetch the users own profile if authenticated with cookie', async () => {
            const res = await request(app)
                .get('/api/auth/me')
                .set('Cookie', [`jwt=${authToken}`])
                .expect(200);

            expect(res.body.user).toBeDefined();
            expect(res.body.user.email).toBe(testUser.email);
            expect(res.body.user.passwordHash).toBeUndefined(); // Security check: Ensure password hash is not leaked
        });

        it('should reject access if no cookie is provided', async () => {
            const res = await request(app)
                .get('/api/auth/me')
                .expect(401);

            expect(res.body.error).toMatch(/No token provided/i);
        });
    });
});
