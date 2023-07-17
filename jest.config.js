module.exports = {
  rootDir: "./src",
  collectCoverage: true,
  verbose: true,
  testMatch: [
    "**/__tests__/**/*.js?(x)",
    "**/?(*.)+(spec|test).js?(x)"
  ],
  setupFiles: ["dotenv/config"],
  globalTeardown: "./test_files/test_cleanup.js",
};