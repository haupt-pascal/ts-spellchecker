<script>
// This is the default layout for the application
</script>
<template>
    <div class="layout">
        <AppHeader />
        <slot />
        <AppFooter />
    </div>
</template>
<style lang="scss" scoped>
.layout {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    max-width: 1200px;
    margin: 0 auto;
}
</style>
