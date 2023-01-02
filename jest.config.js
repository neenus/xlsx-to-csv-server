module.exports = {
  rootDir: "./src",
  collectCoverage: true,
  verbose: true,
  testMatch: [
    "**/__tests__/**/*.js?(x)",
    "**/?(*.)+(spec|test).js?(x)"
  ],
  globalTeardown: "./test_files/test_cleanup.js",
};