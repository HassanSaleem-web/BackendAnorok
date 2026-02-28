module.exports = {
    testEnvironment: 'node',
    setupFilesAfterEnv: ['./tests/setup.js'],
    testMatch: ['**/tests/**/*.test.js'],
    collectCoverageFrom: [
        'services/**/*.js',
        'controllers/**/*.js',
        'middleware/**/*.js'
    ],
    coverageDirectory: 'coverage',
    testTimeout: 10000,
};
