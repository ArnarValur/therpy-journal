// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: {
    enabled: true,

    timeline: {
      enabled: true
    }
  },
  modules: [
    '@pinia/nuxt',
    //'reka-ui/nuxt',
    '@nuxtjs/tailwindcss',
    '@nuxt/eslint',
    '@nuxtjs/color-mode',
    'nuxt-tiptap-editor',
    ['nuxt-vuefire', {
      config: {
        apiKey: process.env.NUXT_FIREBASE_API_KEY,
        authDomain: process.env.NUXT_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NUXT_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NUXT_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NUXT_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NUXT_FIREBASE_APP_ID
      },
      auth: true,
      admin: {
        serviceAccount: {
          projectId: process.env.NUXT_FIREBASE_PROJECT_ID,
          clientEmail: process.env.NUXT_FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.NUXT_FIREBASE_PRIVATE_KEY
        }
      }
    }]
  ],
  colorMode: {
    preference: 'system', // default value of $colorMode.preference
    fallback: 'light', // fallback value if not system preference found
    hid: 'nuxt-color-mode-script',
    globalName: '__NUXT_COLOR_MODE__',
    componentName: 'ColorScheme',
    classPrefix: '',
    classSuffix: '',
    storage: 'localStorage', // or 'sessionStorage' or 'cookie'
    storageKey: 'nuxt-color-mode'
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
        { rel: 'icon', type: 'image/png', href: '/favicon.png' },
        { rel: 'shortcut icon', href: '/favicon.ico' }
      ]
    }
  },
  runtimeConfig: {
    // Private keys that are exposed to the server
    firebaseAdmin: {
      projectId: process.env.NUXT_FIREBASE_PROJECT_ID,
      clientEmail: process.env.NUXT_FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.NUXT_FIREBASE_PRIVATE_KEY,
    },
    // Public keys that are exposed to the client
    public: {
      firebase: {
        apiKey: process.env.NUXT_FIREBASE_API_KEY,
        authDomain: process.env.NUXT_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NUXT_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NUXT_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NUXT_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NUXT_FIREBASE_APP_ID,
      }
    }
  },
  typescript: {
    strict: true,
    typeCheck: true
  },
  debug: true
})