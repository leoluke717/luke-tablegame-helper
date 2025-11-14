<template>
  <section class="control-panel">
    <h2>🎮 游戏控制</h2>

    <div class="host-controls">
      <button
        class="btn-primary"
        @click="$emit('reveal-next-card')"
        :disabled="!nextFloorToReveal"
      >
        {{ nextFloorToReveal ? `📤 揭示 ${nextFloorToReveal}F` : '✅ 全部揭示完成' }}
      </button>

      <button
        v-if="fartCardsRevealedCount >= 4"
        class="btn-settlement"
        @click="$emit('trigger-settlement')"
      >
        🏁 终局结算
      </button>

      <!-- 玩家出局操作 -->
      <div class="eliminate-section">
        <label class="eliminate-label">让玩家出局：</label>
        <select v-model="selectedPlayerId" class="eliminate-select">
          <option :value="null">选择玩家...</option>
          <option
            v-for="player in availablePlayers"
            :key="player.id"
            :value="player.id"
          >
            ({{ player.sequence || '?' }}号) {{ player.name }}
          </option>
        </select>
        <button
          class="btn-eliminate"
          @click="$emit('eliminate-player', selectedPlayerId)"
          :disabled="!selectedPlayerId"
        >
          💀 让其出局
        </button>
      </div>

      <button
        class="btn-secondary"
        @click="$emit('restart-game')"
        :disabled="isLoading"
      >
        🔄 重新开始
      </button>
    </div>
  </section>
</template>

<script>
export default {
  name: 'HostControlPanel',
  props: {
    players: {
      type: Array,
      required: true
    },
    nextFloorToReveal: {
      type: Number,
      default: null
    },
    fartCardsRevealedCount: {
      type: Number,
      default: 0
    },
    isLoading: {
      type: Boolean,
      default: false
    },
    myPlayerId: {
      type: String,
      required: true
    }
  },
  emits: ['reveal-next-card', 'trigger-settlement', 'eliminate-player', 'restart-game'],
  data() {
    return {
      selectedPlayerId: null
    }
  },
  computed: {
    availablePlayers() {
      return this.players.filter(p => p.status !== 'out' && p.id !== this.myPlayerId)
    }
  },
  watch: {
    players: {
      handler() {
        // 当玩家列表变化时，重置选择
        this.selectedPlayerId = null
      },
      deep: true
    }
  }
}
</script>

<style scoped>
.control-panel {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.control-panel h2 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 1.2em;
}

.host-controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.btn-primary, .btn-secondary, .btn-settlement {
  width: 100%;
  padding: 12px 20px;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1em;
  font-weight: bold;
  transition: all 0.3s;
}

.btn-primary {
  background: #2196f3;
}

.btn-primary:hover:not(:disabled) {
  background: #1976d2;
  transform: translateY(-2px);
}

.btn-secondary {
  background: #95a5a6;
}

.btn-secondary:hover:not(:disabled) {
  background: #7f8c8d;
}

.btn-settlement {
  background: #9c27b0;
}

.btn-settlement:hover:not(:disabled) {
  background: #7b1fa2;
}

.btn-primary:disabled, .btn-secondary:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
}

/* 玩家出局操作样式 */
.eliminate-section {
  margin-top: 15px;
  padding: 15px;
  background: #fff3f3;
  border: 2px solid #ffcdd2;
  border-radius: 8px;
}

.eliminate-label {
  display: block;
  font-weight: 600;
  color: #c62828;
  margin-bottom: 10px;
  font-size: 0.95em;
}

.eliminate-select {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid #e57373;
  border-radius: 6px;
  background: white;
  font-size: 0.95em;
  color: #333;
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 10px;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 35px;
}

.eliminate-select:hover {
  border-color: #e53935;
  box-shadow: 0 2px 4px rgba(229, 57, 53, 0.2);
}

.eliminate-select:focus {
  outline: none;
  border-color: #e53935;
  box-shadow: 0 0 0 3px rgba(229, 57, 53, 0.1);
}

.eliminate-select option {
  padding: 8px;
  color: #333;
}

.eliminate-section .btn-eliminate {
  width: 100%;
  padding: 10px 20px;
  background: linear-gradient(135deg, #e53935 0%, #c62828 100%);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.95em;
  font-weight: 600;
  transition: all 0.3s;
  box-shadow: 0 2px 4px rgba(229, 57, 53, 0.3);
}

.eliminate-section .btn-eliminate:hover:not(:disabled) {
  background: linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(229, 57, 53, 0.4);
}

.eliminate-section .btn-eliminate:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(229, 57, 53, 0.3);
}

.eliminate-section .btn-eliminate:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
</style>
