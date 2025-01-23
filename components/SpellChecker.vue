<script setup lang="ts">
const editorRef = ref<HTMLDivElement | null>(null)
const overlayRef = ref<HTMLDivElement | null>(null)
const isChecking = ref(false)
const wrongWords = ref<Array<{ word: string; suggestion: string }>>([])

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
    if (!process.env.LANGUAGETOOL_API) {
        throw new Error('LANGUAGETOOL_API environment variable is not set')
    }
    const response = await fetch(process.env.LANGUAGETOOL_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ text, language: 'en-US' }),
    })
    return response.json()
}

const handleInput = debounce(async (e: Event) => {
    if (!editorRef.value?.textContent) {
        if (overlayRef.value) overlayRef.value.innerHTML = ''
        wrongWords.value = []
        return
    }
    isChecking.value = true

    try {
        const result = await checkSpelling(editorRef.value.textContent)
        if (overlayRef.value) {
            overlayRef.value.innerHTML = ''
            wrongWords.value = result.matches.map((match) => ({
                // biome-ignore lint/style/noNonNullAssertion: <explanation>
                word: editorRef.value!.textContent!.slice(
                    match.offset,
                    match.offset + match.length
                ),
                suggestion: match.replacements[0]?.value || 'No suggestion',
            }))

            // biome-ignore lint/complexity/noForEach: <explanation>
            result.matches.forEach((match) => {
                const range = document.createRange()
                const walker = document.createTreeWalker(
                    // biome-ignore lint/style/noNonNullAssertion: <explanation>
                    editorRef.value!,
                    NodeFilter.SHOW_TEXT
                )
                let currentOffset = 0
                // biome-ignore lint/suspicious/noImplicitAnyLet: <explanation>
                let node

                // biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
                while ((node = walker.nextNode())) {
                    // biome-ignore lint/style/noNonNullAssertion: <explanation>
                    const nodeLength = node.textContent!.length
                    if (currentOffset + nodeLength > match.offset) {
                        range.setStart(node, match.offset - currentOffset)
                        range.setEnd(
                            node,
                            match.offset - currentOffset + match.length
                        )
                        const rects = range.getClientRects()
                        if (rects.length > 0) {
                            const editorRect =
                                // biome-ignore lint/style/noNonNullAssertion: <explanation>
                                editorRef.value!.getBoundingClientRect()
                            const relativeTop = rects[0].top - editorRect.top

                            const container = document.createElement('div')
                            container.className =
                                'absolute group pointer-events-auto cursor-pointer'
                            container.style.left = `${
                                rects[0].left - editorRect.left
                            }px`
                            container.style.top = `${relativeTop}px`
                            container.style.width = `${rects[0].width}px`
                            container.style.height = `${rects[0].height}px`

                            const error = document.createElement('div')
                            error.className =
                                'opacity-0 group-hover:opacity-100 absolute -top-6 left-0 bg-error text-white text-xs px-2 py-1 rounded whitespace-nowrap z-20'
                            error.textContent = `${match.message} Suggestion: ${
                                match.replacements[0]?.value || 'No suggestion'
                            }`

                            const underline = document.createElement('div')
                            underline.className =
                                'border-b-2 border-error absolute w-full'
                            underline.style.top = '100%'
                            underline.style.transform = 'translateY(0)'
                            underline.style.left = '-15px'

                            container.appendChild(error)
                            container.appendChild(underline)
                            overlayRef.value?.appendChild(container)
                        }
                        break
                    }
                    currentOffset += nodeLength
                }
            })
        }
    } catch (err) {
        console.error(err)
        wrongWords.value = []
    }

    isChecking.value = false
}, 100)
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
                <div
                    ref="editorRef"
                    contenteditable="true"
                    class="min-h-[200px] min-w-64 p-4 bg-base-200 rounded-lg focus:outline-none"
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
