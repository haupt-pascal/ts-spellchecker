export default defineNuxtConfig({
    compatibilityDate: '2024-11-01',
    devtools: { enabled: true },
    plugins: ['daisyui'],
    modules: ['@nuxtjs/tailwindcss'],
    css: ['~/assets/css/tailwind.css'],
    app: {
        head: {
            htmlAttrs: {
                lang: 'en',
            },
            title: 'ts-spellchecker | Open Source TypeScript Spellchecker',
            meta: [
                {
                    name: 'ts-spellchecker is an open-source spellchecker written in Nuxt with Typescript and Bun. It is a simple spellchecker that can be used to check the spelling of a word or a sentence.',
                },
            ],
            link: [
                { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
                {
                    rel: 'icon',
                    type: 'image/png',
                    sizes: '32x32',
                    href: '/favicon-32x32.png',
                },
                {
                    rel: 'icon',
                    type: 'image/png',
                    sizes: '16x16',
                    href: '/favicon-16x16.png',
                },
                {
                    rel: 'apple-touch-icon',
                    sizes: '180x180',
                    href: '/apple-touch-icon.png',
                },
                { rel: 'manifest', href: '/site.webmanifest' },
            ],
        },
    },
})
