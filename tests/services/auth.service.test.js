const authService = require('../../services/auth.service');
const User = require('../../models/User');

describe('Auth Service', () => {
    const mockUser = {
        fullName: 'Test User',
        email: 'test@example.com',
        password: 'Password123!',
        role: 'user'
    };

    describe('Signup', () => {
        it('should successfully register a new user and return a token', async () => {
            const { user, token } = await authService.signup(mockUser);

            expect(user).toBeDefined();
            expect(user.email).toBe(mockUser.email);
            expect(user.fullName).toBe(mockUser.fullName);
            expect(user.passwordHash).toBeDefined();
            expect(user.passwordHash).not.toBe(mockUser.password); // Should be hashed
            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
        });

        it('should throw Error if email already exists', async () => {
            await authService.signup(mockUser);

            await expect(authService.signup(mockUser)).rejects.toThrow('An account with this email already exists');
        });

        it('should throw an error with 400 status if missing required fields', async () => {
            const incompleteUser = { email: 'bad@example.com' };

            let caughtError;
            try {
                await authService.signup(incompleteUser);
            } catch (err) {
                caughtError = err;
            }

            expect(caughtError).toBeDefined();
            expect(caughtError.status).toBe(400);
            expect(caughtError.message).toMatch(/fullName, email and password are required/);
        });
    });

    describe('Login', () => {
        beforeEach(async () => {
            await authService.signup(mockUser);
        });

        it('should return a user and token with correct credentials', async () => {
            const { user, token } = await authService.login({
                email: mockUser.email,
                password: mockUser.password
            });

            expect(user).toBeDefined();
            expect(user.email).toBe(mockUser.email);
            expect(token).toBeDefined();
        });

        it('should throw Error if user does not exist', async () => {
            await expect(authService.login({
                email: 'wrong@example.com',
                password: mockUser.password
            })).rejects.toThrow('Invalid credentials');
        });

        it('should throw Error if password is correct', async () => {
            await expect(authService.login({
                email: mockUser.email,
                password: 'WrongPassword1!'
            })).rejects.toThrow('Invalid credentials');
        });
    });
});
