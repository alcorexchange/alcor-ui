module.exports = {
  root: true,

  parserOptions: {
    parser: 'babel-eslint',
    sourceType: 'module'
  },

  env: {
    browser: true
  },

  extends: [
    // https://github.com/vuejs/eslint-plugin-vue#priority-a-essential-error-prevention
    // consider switching to `plugin:vue/strongly-recommended` or `plugin:vue/recommended` for stricter rules.
    'plugin:vue/essential',
    '@vue/standard',
    '@nuxtjs'
  ],

  // required to lint *.vue files
  plugins: [
    'vue'
  ],

  globals: {
    'ga': true, // Google Analytics
    'cordova': true,
    '__statics': true,
    'process': true,
    'Capacitor': true
  },

  // add your custom rules here
  rules: {
    // allow async-await
    'quotes': 1,
    'no-unused-expressions': 0,
    'generator-star-spacing': 'off',
    // allow paren-less arrow functions
    'arrow-parens': 'off',
    'one-var': 'off',

    'import/first': 'off',
    'import/named': 'error',
    'import/namespace': 'error',
    'import/default': 'error',
    'import/export': 'error',
    'import/extensions': 'off',
    'import/no-unresolved': 'off',
    'import/no-extraneous-dependencies': 'off',
    'prefer-promise-reject-errors': 'off',

    // allow console.log during development only
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    // allow debugger during development only
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'camelcase': 'off',
    'no-return-await': 'off',
    'curly': 'off',
    'require-await': 1,
    'no-unreachable': 1,
    'no-return-assign': 0,
    'no-multiple-empty-lines': 1,
    'spaced-comment': 1,
    'no-unused-vars': 1,
    'spaced-comment': 0,
    'padded-blocks': 1,
    'space-before-function-paren': 0,
    'comma-dangle': 1,
    'eqeqeq': 0,
    'prefer-const': 1,
    'no-useless-catch': 0,

    'vue/require-default-prop': 1,
    'vue/require-prop-types': 0
  }
}
