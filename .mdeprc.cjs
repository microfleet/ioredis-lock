module.exports = {
  auto_compose: true,
  node: "22",
  parallel: 1,
  services: ['redis'],
  test_framework: "mocha",
  tests: "./spec/**/*.spec.ts"
}
