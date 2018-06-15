module.exports = {
  roots: [
    './test',
  ],
  setupTestFrameworkScriptFile: './test/_helpers.jsx',
  testEnvironment: 'node',
  testRegex: '.*(\\.|/|_)(test)\\.jsx?$',
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.{js,jsx}'],
};
