module.exports = {
	globals: {
		'ts-jest': {
			tsConfig: 'tsconfig.json'
		}
	},
	moduleFileExtensions: [
		'ts',
		'js'
	],
	// transform: {
	// 	'^.+\\.(ts|tsx)$': '<rootDir>/node_modules/ts-jest/preprocessor.js'
	// },
	testMatch: [
		'**/test/**/*.test.(ts|js)'
	],
	testEnvironment: 'node',
	preset: 'ts-jest'
};