// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt([
  // Your custom configs here
  {
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/no-multiple-template-root': 'off',
    },
    languageOptions: {
      globals: {
        definePageMeta: 'readonly',
        useRouter: 'readonly',
        useRuntimeConfig: 'readonly',
        defineNuxtRouteMiddleware: 'readonly',
        navigateTo: 'readonly',
        defineNuxtPlugin: 'readonly'
      }
    }
  }
])
