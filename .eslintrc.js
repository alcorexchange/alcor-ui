module.exports = {
  root: true,
  env: {
    browser: true,
    node: true
  },
  parserOptions: {
    parser: 'babel-eslint'
  },
  extends: [
    '@nuxtjs',
    'plugin:nuxt/recommended'
  ],
  // add your custom rules here
  rules: {
    "no-multiple-empty-lines": 0,
    "curly": 0,
    "object-curly-spacing": 0,
    "space-before-function-paren": 0,
    "camelcase": 0,
    "template-curly-spacing" : 0,
    "indent" : 0,
    "no-return-await": 0,
    "no-return-assign": 0,
    "eqeqeq": 0,
    "prefer-const": 0,
    "standard/object-curly-even-spacing": 0,
    "spaced-comment": 0,
    "no-unused-vars": 1,
    "no-unreachable": 1
  }
}
