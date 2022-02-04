module.exports = {
  nycCoverage: false,
  coverage: false,
  auto_compose: true,
  node: "16",
  parallel: 1,
  services: ['redis'],
  test_framework: "mocha -r @swc-node/register -R spec",
  tests: "./spec/**/*.spec.ts"
}
