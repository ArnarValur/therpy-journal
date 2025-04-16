// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: [
    '@pinia/nuxt',
    'reka-ui/nuxt',
    '@nuxtjs/tailwindcss',
    '@nuxt/eslint',
    '@nuxtjs/color-mode'
  ],
  colorMode: {
    preference: 'system', // default value of $colorMode.preference
    fallback: 'light', // fallback value if not system preference found
    classSuffix: '', // Use this format for tailwind: 'dark' instead of 'dark-mode'
    storage: 'localStorage' // Use local storage for persistence
  },
  css: [
    'remixicon/fonts/remixicon.css',
    '~/assets/css/theme.css'
  ],
  app: {
    head: {
      title: 'TherapyJournal',
      meta: [
        { name: 'description', content: 'A secure journal system for therapy' }
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon.png' }
      ]
    }
  },
  runtimeConfig: {
    public: {
      firebaseApiKey: 'AIzaSyCoUiNnx-yJ6vVsDqvk0nJq-05BaJfJGFE',
      firebaseAuthDomain: 'therapy-journal-18762.firebaseapp.com',
      firebaseProjectId: 'therapy-journal-18762',
      firebaseStorageBucket: 'therapy-journal-18762.firebasestorage.app',
      firebaseMessagingSenderId: '642768975271',
      firebaseAppId: '1:642768975271:web:f9ad37c4a4a45e0318f282',
      firebaseMeasurementId: 'G-K10N6BT22V'
    }
  },
  typescript: {
    strict: true,
    typeCheck: true
  }
})