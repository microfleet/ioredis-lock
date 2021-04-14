module.exports = {
  nycCoverage: false,
  coverage: false,
  auto_compose: true,
  node: "14",
  parallel: 1,
  services: ['redis'],
  test_framework: "mocha -r ts-node/register -R spec",
  tests: "./spec/**/*.spec.ts"
}
