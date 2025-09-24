/** @type {import('ts-jest').JestConfigWithTsJest} **/
export default {
	testEnvironment: "node",
	preset: 'ts-jest',
	roots: ['<rootDir>/src', '<rootDir>/test'],
	testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
	transform: {
		'^.+\\.ts$': 'ts-jest',
	},
	moduleFileExtensions: ['ts', 'js', 'json'],
	collectCoverageFrom: [
		'src/**/*.{ts,js}',
		'!src/**/*.d.ts',
	],
	// setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
};