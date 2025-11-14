<template>
  <section class="waiting-section">
    <div class="waiting-content">
      <div class="waiting-icon">⏳</div>
      <h2>等待房主开始游戏</h2>
      <p v-if="canRevealCards" class="waiting-text">
        您是房主，点击下方按钮开始游戏
      </p>
      <p v-else class="waiting-text">
        等待房主开始游戏...
      </p>
    </div>
    <div v-if="canRevealCards" class="host-init-controls">
      <button
        class="btn-primary btn-large"
        @click="$emit('start-game')"
        :disabled="isLoading"
      >
        🎮 开始游戏
      </button>
    </div>
  </section>
</template>

<script>
export default {
  name: 'WaitingForGameStart',
  props: {
    canRevealCards: {
      type: Boolean,
      default: false
    },
    isLoading: {
      type: Boolean,
      default: false
    }
  },
  emits: ['start-game']
}
</script>

<style scoped>
.waiting-section {
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.waiting-content {
  margin-bottom: 30px;
}

.waiting-icon {
  font-size: 4em;
  margin-bottom: 15px;
  animation: waitingPulse 2s ease-in-out infinite;
}

@keyframes waitingPulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.waiting-section h2 {
  margin: 0 0 15px 0;
  color: #555;
  font-size: 1.5em;
}

.waiting-text {
  color: #666;
  font-size: 1.1em;
  margin: 0;
}

.host-init-controls {
  margin-top: 20px;
}

.btn-large {
  padding: 15px 40px;
  font-size: 1.2em;
}

.btn-primary {
  background: #2196f3;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s;
}

.btn-primary:hover:not(:disabled) {
  background: #1976d2;
  transform: translateY(-2px);
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
}
</style>
