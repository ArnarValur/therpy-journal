module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
  },
  extends: [
    '@nuxtjs/eslint-config-typescript',
    'plugin:nuxt/recommended',
  ],
  rules: {
    'vue/no-v-html': 'off' // Disable v-html warning since we're using sanitized content
  }
} 