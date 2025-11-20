<script setup lang="ts">
import { ref, onMounted, onUnmounted, inject, nextTick } from "vue";
import { readItems } from "@directus/sdk";
import client, { type Message } from "./directus";

const api = inject("api") as any;

const messages = ref<Message[]>([]);
const newMessage = ref("");
const currentUser = ref<string | null>(null);
const isConnected = ref(false);
const isLoading = ref(true);

const initWebSocket = async () => {
    try {
        console.log("1. Connecting with Static Token...");

        const token = "-hGnmosV00iSJIiuywESB5KuXIij6QTY";

        if (!token)
            throw new Error("Please put your static token in the code!");

        client.setToken(token);

        await client.connect();

        client.onWebSocket("message", (data) => {
            if (data.type === "ping") client.sendMessage({ type: "pong" });

            if (data.type === "auth" && data.status === "ok") {
                console.log("WebSocket Authenticated!");
                isConnected.value = true;
                subscribeToMessages();
                fetchHistory();
            }

            if (data.type === "subscription" && data.event === "create") {
                const newMsg = data.data[0];
                messages.value.push(newMsg);
                scrollToBottom();
            }
        });

        client.sendMessage({ type: "auth", access_token: token });
    } catch (e) {
        console.error("WebSocket setup failed:", e);
        isLoading.value = false;
    }
};

const subscribeToMessages = () => {
    client.sendMessage({
        type: "subscribe",
        collection: "messages",
        event: "create",
        query: {
            fields: [
                "id",
                "text",
                "user_created.first_name",
                "user_created.id",
                "date_created",
            ],
        },
    });
};

const fetchHistory = async () => {
    try {
        // 2. The SDK now KNOWS this returns Message[]
        // You do not need to force it or ignore it.
        const history = await client.request(
            readItems("messages", {
                sort: ["date_created"],
                limit: 50,
                fields: [
                    "id",
                    "text",
                    "date_created",
                    {
                        user_created: [
                            "id",
                            "first_name",
                            "last_name",
                            "email",
                        ],
                    },
                ],
            }),
        );

        messages.value = history;

        scrollToBottom();
    } catch (e) {
        console.error("Failed to load history", e);
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
    } catch (error) {
        console.error("Send Failed:", error);
        newMessage.value = textToSend;
        alert("Failed to send.");
    }
};

const fetchMe = async () => {
    try {
        const response = await api.get("/users/me");
        currentUser.value = response.data.data.id;
    } catch (e) {}
};

const scrollToBottom = () => {
    nextTick(() => {
        const container = document.querySelector(".messages-window");
        if (container) container.scrollTop = container.scrollHeight;
    });
};

const formatTime = (isoString: string) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return new Intl.DateTimeFormat("default", {
        hour: "numeric",
        minute: "numeric",
    }).format(date);
};

onMounted(() => {
    fetchMe();
    initWebSocket();
});

onUnmounted(() => {
    client.disconnect();
});
</script>

<template>
    <div class="chat-widget">
        <div class="chat-header">
            <h3>Team Chat</h3>
            <div class="live-indicator">
                <span class="dot" :class="{ active: isConnected }"></span>
                {{ isConnected ? "Live Socket" : "Connecting..." }}
            </div>
        </div>

        <div class="messages-window">
            <div v-if="isLoading" class="loading">Starting Engine...</div>
            <div v-else-if="messages.length === 0" class="empty">
                No messages yet.
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
                :disabled="!isConnected"
            />
            <button @click="sendMessage" :disabled="!isConnected">Send</button>
        </div>
    </div>
</template>

<style scoped>
.chat-widget {
    --white: #ffffff;

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
    color: var(--theme--foreground-subdued);
    display: flex;
    align-items: center;
    gap: 6px;
}
.dot {
    width: 8px;
    height: 8px;
    background: #ccc;
    border-radius: 50%;
    transition: background 0.3s;
}
.dot.active {
    background: var(--theme--primary);
    box-shadow: 0 0 4px var(--theme--primary);
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
    border-top-left-radius: 2px;
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
.my-message .timestamp {
    color: rgba(255, 255, 255, 0.7);
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
input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
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
}
button:disabled {
    background: #ccc;
    cursor: not-allowed;
}
button:hover:not(:disabled) {
    opacity: 0.9;
}
</style>
