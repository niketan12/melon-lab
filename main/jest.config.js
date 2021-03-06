module.exports = {
  "verbose": true,
  "testEnvironment": "node",
  "setupFiles": ["<rootDir>/jest.setup.js"],
  "transform": {
    "\\.(gql|graphql)$": "jest-transform-graphql",
    "^.+\\.tsx?$": "ts-jest"
  },
  "testRegex": "(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$",
  "moduleFileExtensions": [
    "ts",
    "tsx",
    "js",
    "jsx",
    "json",
    "node"
  ],
  "globals": {
    "ts-jest": {
      "tsConfig": "<rootDir>/tsconfig.json",
      "diagnostics": false
    }
  }
};
