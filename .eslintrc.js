module.exports = {
  root: true,

  parserOptions: {
    // parser: 'babel-eslint',
    // sourceType: 'module',

    parser: '@typescript-eslint/parser',
    //sourceType: 'module',
  },

  env: {
    es2020: true,
    browser: true,
  },

  extends: [
    // https://github.com/vuejs/eslint-plugin-vue#priority-a-essential-error-prevention
    // consider switching to `plugin:vue/strongly-recommended` or `plugin:vue/recommended` for stricter rules.
    //
    //'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:vue/essential',
    'plugin:vue/recommended',
    'plugin:vue/strongly-recommended',
    'plugin:nuxt/recommended',
    '@vue/standard',
    '@nuxtjs',

    // 'plugin:import/recommended',
    // 'plugin:vue/essential',
    // '@vue/standard',
    // '@nuxtjs'
  ],

  // required to lint *.vue files
  plugins: ['import', 'vue', '@typescript-eslint'],
  //plugins: ['import', 'vue'],

  globals: {
    ga: true, // Google Analytics
    cordova: true,
    __statics: true,
    process: true,
    Capacitor: true,
  },

  // add your custom rules here
  rules: {
    // allow async-await
    quotes: 1,
    'unicorn/number-literal-case': 'off',
    'comma-dangle': ['error', 'only-multiline'],
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
    'standard/no-callback-literal': 0,
    camelcase: 'off',
    'no-return-await': 'off',
    curly: 'off',
    'require-await': 1,
    'no-unreachable': 1,
    'no-return-assign': 0,
    'no-multiple-empty-lines': 1,
    'spaced-comment': 1,
    'no-unused-vars': 1,
    'new-cap': 0,
    'spaced-comment': 0,
    'padded-blocks': 1,
    'space-before-function-paren': 0,
    eqeqeq: 0,
    'prefer-const': 1,
    'no-useless-catch': 0,

    'vue/require-default-prop': 1,
    'vue/require-prop-types': 0,
  },

  // Because ts do that check
  overrides: [
    {
      files: ['*.ts'],
      rules: {
        'no-undef': 'off',
      },
    },
  ],


  // settings: {
  //   'import/parsers': {
  //     '@typescript-eslint/parser': ['.ts', '.tsx'],
  //   },
  //   'import/resolver': {
  //     typescript: {
  //       //alwaysTryTypes: true, // always try to resolve types under `<root>@types` directory even it doesn't contain any source code, like `@types/unist`

  //       // Choose from one of the "project" configs below or omit to use <root>/tsconfig.json by default

  //       // use <root>/path/to/folder/tsconfig.json
  //       // project: 'path/to/folder',

  //       // // Multiple tsconfigs (Useful for monorepos)

  //       // // use a glob pattern
  //       // project: 'packages/*/tsconfig.json',
  //     },
  //   },
  // }
}
