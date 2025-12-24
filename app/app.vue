<script setup lang="ts">
const { data } = await useFetch('/api/sensor')
</script>

<template>
<h1>Hello</h1>
<p>{{ data }}</p>
</template>
