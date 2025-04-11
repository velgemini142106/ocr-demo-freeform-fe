// @ts-ignore
export default defineNuxtConfig({
  devtools: {enabled: true},

  modules: [
      "@vuestic/nuxt",
      '@nuxt/image',
      '@nuxtjs/tailwindcss',
      '@pinia/nuxt',
  ],

  css: ["@/assets/css/main.css",],

  build: {
      extend(config, {isClient}) {
          // Extend only webpack config for client-bundle
          if (isClient) {
              config.devtool = 'source-map'
          }
      }
  },

  runtimeConfig: {
      public: {
          backendApi: process.env.NUXT_BACKEND_URL
      }
  },

  compatibilityDate: '2025-04-11',
})