<script setup lang="ts">
import Chat from "./Chat.vue";
</script>

<template>
    <private-view title="Chat Module">
        <div class="module-content">
            <h1>Project Chat</h1>
            <p>Welcome to the team communication center.</p>

            <div class="chat-wrapper">
                <Chat />
            </div>
        </div>
    </private-view>
</template>

<style scoped>
.module-content {
    padding: 24px;
}

.chat-wrapper {
    margin-top: 20px;
    max-width: full;
    border: 1px solid var(--theme--form--field--input--border-color);
    border-radius: var(--theme--border-radius);
    background-color: var(--theme--background);
}
</style>
