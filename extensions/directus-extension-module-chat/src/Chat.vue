<script setup lang="ts">
import { ref, onMounted, onUnmounted, inject, nextTick } from "vue";

const api = inject("api") as any;

type Message = {
    id: string;
    user_created: {
        id: string;
        first_name: string;
        last_name?: string;
    };
    text: string;
    date_created: string;
};

const messages = ref<Message[]>([]);
const newMessage = ref("");
const currentUser = ref(null);
const isLoading = ref(true);
let pollingInterval: ReturnType<typeof setInterval> | null = null;

const fetchMessages = async () => {
    try {
        const response = await api.get("/items/messages", {
            params: {
                sort: "date_created",
                limit: 50,
                fields: [
                    "id",
                    "text",
                    "user_created.first_name",
                    "user_created.id",
                    "date_created",
                ],
            },
        });

        const isFirstLoad = messages.value.length === 0;
        const newCount = response.data.data.length;
        const currentCount = messages.value.length;

        messages.value = response.data.data;
        isLoading.value = false;

        if (isFirstLoad || newCount > currentCount) {
            scrollToBottom();
        }
    } catch (error) {
        console.error("Chat Load Error:", error);
    }
};

const sendMessage = async () => {
    if (!newMessage.value.trim()) return;

    const textToSend = newMessage.value;
    newMessage.value = "";

    try {
        await api.post("/items/messages", {
            text: textToSend,
        });
        await fetchMessages();
    } catch (error) {
        console.error("Send Failed:", error);
        newMessage.value = textToSend;
        alert("Failed to send message. Check console for permission errors.");
    }
};

const fetchMe = async () => {
    try {
        const response = await api.get("/users/me");
        currentUser.value = response.data.data.id;
    } catch (e) {
        // Ignore error if we can't fetch "me"
    }
};

const scrollToBottom = () => {
    nextTick(() => {
        const container = document.querySelector(".messages-window");
        if (container) container.scrollTop = container.scrollHeight;
    });
};

onMounted(async () => {
    if (!api) return;

    await fetchMe();
    await fetchMessages();

    pollingInterval = setInterval(fetchMessages, 2000);
});

onUnmounted(() => {
    if (pollingInterval) clearInterval(pollingInterval);
});

const formatTime = (isoString: string) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return new Intl.DateTimeFormat("default", {
        hour: "numeric",
        minute: "numeric",
        month: "short",
        day: "numeric",
    }).format(date);
};
</script>

<template>
    <div class="chat-widget">
        <div class="chat-header">
            <h3>Team Chat</h3>
            <div class="live-indicator"><span class="dot"></span> Live</div>
        </div>

        <div class="messages-window">
            <div v-if="isLoading" class="loading">Loading messages...</div>
            <div v-else-if="messages.length === 0" class="empty">
                No messages yet. Say hi!
            </div>

            <div
                v-for="msg in messages"
                :key="msg.id"
                class="message-bubble"
                :class="{ 'my-message': msg.user_created?.id === currentUser }"
            >
                <small class="username">{{
                    msg.user_created?.first_name || "Unknown"
                }}</small>

                <div class="text">{{ msg.text }}</div>

                <small class="timestamp">{{
                    formatTime(msg.date_created)
                }}</small>
            </div>
        </div>

        <div class="input-area">
            <input
                v-model="newMessage"
                @keyup.enter="sendMessage"
                placeholder="Type a message..."
            />
            <button @click="sendMessage">Send</button>
        </div>
    </div>
</template>

<style scoped>
.chat-widget {
    display: flex;
    flex-direction: column;
    height: 500px;
    border: 1px solid var(--theme--form--field--input--border-color);
    border-radius: var(--theme--border-radius);
    background: var(--theme--background);
    overflow: hidden;
}

.chat-header {
    padding: 12px 16px;
    background-color: var(--theme--background-normal);
    border-bottom: 1px solid var(--theme--form--field--input--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.chat-header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
}

.live-indicator {
    font-size: 12px;
    color: var(--theme--primary);
    display: flex;
    align-items: center;
    gap: 6px;
}
.dot {
    width: 8px;
    height: 8px;
    background: var(--theme--primary);
    border-radius: 50%;
    animation: pulse 2s infinite;
}

.messages-window {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.message-bubble {
    max-width: 75%;
    padding: 10px 14px;
    border-radius: 12px;
    border-top-left-radius: 2px; /* Speech bubble effect */
    background-color: var(--theme--background-normal);
    align-self: flex-start;
    line-height: 1.4;
}

.my-message {
    background-color: var(--theme--primary);
    color: var(--white);
    align-self: flex-end;
    border-top-left-radius: 12px;
    border-top-right-radius: 2px;
}
.my-message .username {
    color: rgba(255, 255, 255, 0.8);
}

.username {
    font-size: 11px;
    opacity: 0.7;
    display: block;
    margin-bottom: 4px;
    font-weight: 700;
}

.timestamp {
    display: block;
    font-size: 9px;
    opacity: 0.6;
    margin-top: 4px;
    text-align: right;
}

.input-area {
    padding: 12px;
    border-top: 1px solid var(--theme--form--field--input--border-color);
    display: flex;
    gap: 8px;
    background: var(--theme--background);
}

input {
    flex: 1;
    padding: 10px;
    border: 1px solid var(--theme--form--field--input--border-color);
    border-radius: var(--theme--border-radius);
    background: var(--theme--background-page);
    color: var(--theme--foreground);
}
input:focus {
    outline: 2px solid var(--theme--primary);
    border-color: transparent;
}

button {
    padding: 8px 20px;
    background: var(--theme--primary);
    color: var(--white);
    border: none;
    border-radius: var(--theme--border-radius);
    cursor: pointer;
    font-weight: 600;
    transition: opacity 0.2s;
}
button:hover {
    opacity: 0.9;
}

@keyframes pulse {
    0% {
        opacity: 1;
    }
    50% {
        opacity: 0.4;
    }
    100% {
        opacity: 1;
    }
}
</style>
