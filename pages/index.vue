<template>
    <Navigation />
    <div class="container mx-auto mt-24">
        <div class="flex flex-col items-center justify-center">
            <h1 class="text-4xl font-bold text-center">ts-spellchecker</h1>
            <p class="text-center mt-6 w-2/3">
                ts-spellchecker is an open-source spellchecker written in Nuxt
                with Typescript and Bun. It is a simple spellchecker that can be
                used to check the spelling of a word or a sentence.
            </p>
            <div class="mt-4">
                <SpellChecker />
            </div>
        </div>
    </div>
</template>
