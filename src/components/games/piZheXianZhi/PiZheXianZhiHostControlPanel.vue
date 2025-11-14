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
        <div class="player-selector">
          <button
            class="btn-select-player"
            @click="showPlayerList = !showPlayerList"
            :class="{ active: showPlayerList }"
          >
            <span v-if="!selectedPlayerId">选择玩家...</span>
            <span v-else>
              ({{ getPlayerSequence(selectedPlayerId) || '?' }}号) {{ getPlayerName(selectedPlayerId) }}
            </span>
            <span class="arrow" :class="{ expanded: showPlayerList }">▼</span>
          </button>

          <!-- 玩家选择列表（弹窗样式） -->
          <div v-if="showPlayerList" class="player-list-overlay" @click="showPlayerList = false">
            <div class="player-list" @click.stop>
              <div class="player-list-header">
                <h3>选择要出局的玩家</h3>
                <button class="btn-close" @click="showPlayerList = false">✕</button>
              </div>
              <div class="player-list-content">
                <PiZheXianZhiPlayerItem
                  v-for="player in availablePlayers"
                  :key="player.id"
                  :player="player"
                  :clickable="true"
                  :is-me="player.id === myPlayerId"
                  @click="selectPlayer(player.id)"
                />
                <div v-if="availablePlayers.length === 0" class="no-players">
                  暂无可选择的玩家
                </div>
              </div>
            </div>
          </div>
        </div>

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
import PiZheXianZhiPlayerItem from './PiZheXianZhiPlayerItem.vue'

export default {
  name: 'HostControlPanel',
  components: {
    PiZheXianZhiPlayerItem
  },
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
      selectedPlayerId: null,
      showPlayerList: false
    }
  },
  computed: {
    availablePlayers() {
      // 只显示未出局、已准备的玩家（包括房主自己），并按序号排序
      return this.players
        .filter(p =>
          p.status !== 'out' &&
          p.ready === true
        )
        .sort((a, b) => {
          // 按序号排序，空值放在最后
          if (a.sequence === null || a.sequence === undefined) return 1
          if (b.sequence === null || b.sequence === undefined) return -1
          return a.sequence - b.sequence
        })
    }
  },
  methods: {
    selectPlayer(playerId) {
      this.selectedPlayerId = playerId
      this.showPlayerList = false
    },
    getPlayerName(playerId) {
      const player = this.players.find(p => p.id === playerId)
      return player ? player.name : ''
    },
    getPlayerSequence(playerId) {
      const player = this.players.find(p => p.id === playerId)
      return player ? player.sequence : null
    },
    handleClickOutside(event) {
      // 点击外部关闭弹窗
      const selector = this.$el.querySelector('.player-selector')
      if (selector && !selector.contains(event.target)) {
        this.showPlayerList = false
      }
    }
  },
  watch: {
    players: {
      handler() {
        // 当玩家列表变化时，重置选择
        this.selectedPlayerId = null
      },
      deep: true
    },
    showPlayerList(newVal) {
      // 监听弹窗显示状态，添加/移除点击外部监听
      if (newVal) {
        document.addEventListener('click', this.handleClickOutside)
      } else {
        document.removeEventListener('click', this.handleClickOutside)
      }
    }
  },
  beforeUnmount() {
    // 组件销毁时清理事件监听
    document.removeEventListener('click', this.handleClickOutside)
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

/* 玩家选择器 */
.player-selector {
  position: relative;
  margin-bottom: 10px;
}

.btn-select-player {
  width: 100%;
  padding: 12px 15px;
  border: 2px solid #e57373;
  border-radius: 8px;
  background: white;
  color: #333;
  font-size: 1em;
  text-align: left;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn-select-player:hover {
  border-color: #e53935;
  box-shadow: 0 2px 8px rgba(229, 57, 53, 0.2);
}

.btn-select-player.active {
  border-color: #e53935;
  box-shadow: 0 0 0 3px rgba(229, 57, 53, 0.1);
}

.btn-select-player .arrow {
  font-size: 0.8em;
  transition: transform 0.3s;
  color: #666;
}

.btn-select-player .arrow.expanded {
  transform: rotate(180deg);
}

/* 玩家列表覆盖层 */
.player-list-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

/* 玩家列表弹窗 */
.player-list {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 450px;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-50px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.player-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 2px solid #ffcdd2;
}

.player-list-header h3 {
  margin: 0;
  color: #c62828;
  font-size: 1.3em;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5em;
  color: #999;
  cursor: pointer;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  transition: all 0.3s;
}

.btn-close:hover {
  background: #f5f5f5;
  color: #333;
}

.player-list-content {
  padding: 10px;
  overflow-y: auto;
  max-height: calc(70vh - 100px);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.no-players {
  text-align: center;
  padding: 30px;
  color: #999;
  font-size: 1em;
}

.eliminate-section .btn-eliminate {
  width: 100%;
  padding: 12px 20px;
  background: linear-gradient(135deg, #e53935 0%, #c62828 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1em;
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
