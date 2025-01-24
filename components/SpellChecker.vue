<script setup lang="ts">
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const overlayRef = ref<HTMLDivElement | null>(null)
const isChecking = ref(false)
const wrongWords = ref<Array<{ word: string; suggestion: string }>>([])
const runtimeConfig = useRuntimeConfig()

interface SpellResponse {
    matches: Array<{
        message: string
        offset: number
        length: number
        replacements: Array<{
            value: string
        }>
    }>
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
function debounce<T extends (...args: any[]) => any>(
    fn: T,
    delay: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout
    return (...args) => {
        clearTimeout(timeout)
        timeout = setTimeout(() => fn(...args), delay)
    }
}

const checkSpelling = async (text: string): Promise<SpellResponse> => {
    if (!runtimeConfig.public.languageToolApiKey) {
        throw new Error('LANGUAGETOOL_API environment variable is not set')
    }
    const response = await fetch(`${runtimeConfig.public.languageToolApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ text, language: 'en-US' }),
    })
    return response.json()
}

function getTextareaCoordinates(
    textarea: HTMLTextAreaElement,
    position: number
): { top: number; left: number; lineHeight: number } {
    const text = textarea.value.substring(0, position)
    const lines = text.split('\n')
    const currentLine = lines.length
    const lineHeight = Number.parseInt(getComputedStyle(textarea).lineHeight)
    const paddingTop = Number.parseInt(getComputedStyle(textarea).paddingTop)
    const paddingLeft = Number.parseInt(getComputedStyle(textarea).paddingLeft)

    const lastLineText = lines[lines.length - 1]
    const textMetrics = getTextWidth(
        lastLineText,
        getComputedStyle(textarea).font
    )

    return {
        top: (currentLine - 1) * lineHeight + paddingTop - textarea.scrollTop,
        left: textMetrics + paddingLeft - 15,
        lineHeight,
    }
}

const handleInput = debounce(async (e: Event) => {
    const textarea = e.target as HTMLTextAreaElement
    if (!textarea.value) {
        if (overlayRef.value) overlayRef.value.innerHTML = ''
        wrongWords.value = []
        return
    }
    isChecking.value = true

    try {
        const result = await checkSpelling(textarea.value)
        if (overlayRef.value) {
            overlayRef.value.innerHTML = ''
            wrongWords.value = result.matches.map((match) => ({
                word: textarea.value.slice(
                    match.offset,
                    match.offset + match.length
                ),
                suggestion: match.replacements[0]?.value || 'No suggestion',
            }))

            // biome-ignore lint/complexity/noForEach: <explanation>
            result.matches.forEach((match) => {
                if (!textareaRef.value) return

                const coords = getTextareaCoordinates(
                    textareaRef.value,
                    match.offset
                )
                const container = document.createElement('div')
                container.className = 'absolute group pointer-events-none'
                container.style.left = `${coords.left}px`
                container.style.top = `${coords.top}px`
                container.style.height = `${coords.lineHeight}px`

                const error = document.createElement('div')
                error.className =
                    'hidden group-hover:block absolute -top-8 left-0 bg-error text-white text-xs px-2 py-1 rounded whitespace-nowrap z-20 pointer-events-none'
                error.textContent = `${match.message} Suggestion: ${
                    match.replacements[0]?.value || 'No suggestion'
                }`

                const underline = document.createElement('div')
                underline.className =
                    'border-b-2 border-error absolute pointer-events-auto cursor-pointer hover:border-error-focus'
                const wordWidth = getTextWidth(
                    textarea.value.slice(
                        match.offset,
                        match.offset + match.length
                    ),
                    getComputedStyle(textarea).font
                )
                underline.style.width = `${wordWidth}px`
                underline.style.bottom = '0'

                container.appendChild(error)
                container.appendChild(underline)
                overlayRef.value?.appendChild(container)
            })
        }
    } catch (err) {
        console.error(err)
        wrongWords.value = []
    }

    isChecking.value = false
}, 100)

function getTextWidth(text: string, font: string): number {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    if (!context) return 0
    context.font = font
    return context.measureText(text).width
}
</script>

<template>
    <div class="card bg-base-100 shadow-xl mx-4">
        <div class="card-body">
            <div class="relative">
                <div
                    ref="overlayRef"
                    class="absolute inset-y-0 inset-x-4 pointer-events-none"
                >
                    <div class="relative w-full h-full"></div>
                </div>
                <textarea
                    ref="textareaRef"
                    class="min-h-[200px] min-w-[800px] p-4 bg-base-200 rounded-lg focus:outline-none resize-none w-full"
                    @input="handleInput"
                />
            </div>
            <div v-if="isChecking" class="text-sm opacity-70">
                <span class="loading loading-spinner loading-sm" /> Checking...
            </div>
            <div
                v-if="wrongWords.length"
                class="mt-4 space-y-2 p-4 bg-base-200 rounded-lg"
            >
                <h3 class="font-semibold mb-2">Suggested Corrections:</h3>
                <div
                    v-for="({ word, suggestion }, index) in wrongWords"
                    :key="index"
                    class="flex items-center gap-2 text-sm"
                >
                    <span class="text-error font-medium">{{ word }}</span>
                    <span class="text-gray-400">→</span>
                    <span class="text-success font-medium">{{
                        suggestion
                    }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<style>
.group:hover .hidden {
    display: block;
}
</style>
