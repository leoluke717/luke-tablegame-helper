<template>
  <div class="result-overlay">
    <div class="result-modal">
      <div class="result-banner">
        <div class="trophy">🏆</div>
        <h2>游戏结束</h2>
        <div class="winner-text">
          {{ winnerText }}
        </div>
        <div class="result-reason">
          {{ gameResult.reason }}
        </div>
      </div>

      <div class="result-teams">
        <!-- 乘客阵营 -->
        <div class="team-section">
          <h3 class="team-title">👤 乘客阵营</h3>
          <div class="team-players-grid">
            <div
              v-for="player in passengerPlayers"
              :key="player.id"
              class="player-result-item"
              :class="{ 'eliminated': player.status === 'out' }"
            >
              <div class="player-result-avatar-container">
                <div class="player-result-avatar" :class="{ 'grayscale': player.status === 'out' }">
                  {{ player.avatar || '😊' }}
                </div>
                <span class="corner-badge" :class="{ 'alive': player.status === 'alive', 'out': player.status === 'out' }">
                  {{ player.status === 'alive' ? '存活' : '出局' }}
                </span>
              </div>
              <div class="player-result-sequence">
                {{ player.sequence || '?' }}号
              </div>
            </div>
            <div v-if="passengerPlayers.length === 0" class="no-players">
              无乘客玩家
            </div>
          </div>
        </div>

        <!-- 屁者阵营 -->
        <div class="team-section">
          <h3 class="team-title">💨 屁者阵营</h3>
          <div class="team-players-grid">
            <div
              v-for="player in assassinPlayers"
              :key="player.id"
              class="player-result-item"
              :class="{ 'eliminated': player.status === 'out' }"
            >
              <div class="player-result-avatar-container">
                <div class="player-result-avatar" :class="{ 'grayscale': player.status === 'out' }">
                  {{ player.avatar || '😊' }}
                </div>
                <span class="corner-badge" :class="{ 'alive': player.status === 'alive', 'out': player.status === 'out' }">
                  {{ player.status === 'alive' ? '存活' : '出局' }}
                </span>
              </div>
              <div class="player-result-sequence">
                {{ player.sequence || '?' }}号
              </div>
            </div>
            <div v-if="assassinPlayers.length === 0" class="no-players">
              无屁者玩家
            </div>
          </div>
        </div>
      </div>

      <button class="btn-close" @click="handleClose">
        关闭
      </button>
    </div>
  </div>
</template>

<script>
import { PLAYER_IDENTITY } from '../../../config/games/piZheXianZhiDataModel'

export default {
  name: 'GameResult',
  props: {
    gameResult: {
      type: Object,
      required: true
    },
    players: {
      type: Array,
      required: true
    }
  },
  emits: ['exit-game', 'close-result'],
  computed: {
    winnerText() {
      return this.gameResult.winner === PLAYER_IDENTITY.PASSENGER
        ? '👤 乘客阵营获胜'
        : '💨 屁者阵营获胜'
    },
    passengerPlayers() {
      return this.players
        .filter(p => p.identity === PLAYER_IDENTITY.PASSENGER)
        .sort((a, b) => {
          if (a.sequence === null || a.sequence === undefined) return 1
          if (b.sequence === null || b.sequence === undefined) return -1
          return a.sequence - b.sequence
        })
    },
    assassinPlayers() {
      return this.players
        .filter(p => p.identity === PLAYER_IDENTITY.ASSASSIN)
        .sort((a, b) => {
          if (a.sequence === null || a.sequence === undefined) return 1
          if (b.sequence === null || b.sequence === undefined) return -1
          return a.sequence - b.sequence
        })
    }
  },
  methods: {
    handleClose() {
      console.log('🎮 点击了关闭按钮')
      this.$emit('close-result')
    }
  }
}
</script>

<style scoped>
.result-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
}

.result-modal {
  background: linear-gradient(135deg, #fff9e6 0%, #ffe6e6 100%);
  padding: 25px;
  border-radius: 16px;
  text-align: center;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
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

.result-banner {
  margin-bottom: 20px;
}

.trophy {
  font-size: 4em;
  margin-bottom: 10px;
  animation: trophyRotate 2s ease-in-out;
}

@keyframes trophyRotate {
  0%, 100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-10deg);
  }
  75% {
    transform: rotate(10deg);
  }
}

.result-modal h2 {
  margin: 0 0 12px 0;
  color: #856404;
  font-size: 1.5em;
}

.winner-text {
  font-size: 1.4em;
  font-weight: bold;
  color: #856404;
  margin-bottom: 12px;
}

.result-reason {
  font-size: 1em;
  color: #666;
  margin-bottom: 20px;
}

.result-teams {
  background: white;
  padding: 15px;
  border-radius: 12px;
  margin-bottom: 15px;
  text-align: left;
}

.team-section {
  margin-bottom: 15px;
}

.team-section:last-child {
  margin-bottom: 0;
}

.team-title {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 1em;
  padding-bottom: 8px;
  border-bottom: 2px solid #eee;
}

.team-players-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
  gap: 12px;
}

.player-result-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  background-color: #f8f9fa;
  border-radius: 8px;
  transition: all 0.3s;
}

.player-result-item.eliminated {
  opacity: 0.6;
}

.player-result-avatar-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.player-result-avatar {
  font-size: 1.6em;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 2px solid #42b983;
  background-color: #fff;
  overflow: hidden;
  text-align: center;
  flex-shrink: 0;
  transition: all 0.3s;
}

.player-result-avatar.grayscale {
  filter: grayscale(100%);
  border-color: #999;
}

.corner-badge {
  position: absolute;
  top: -6px;
  right: -2px;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 0.65em;
  font-weight: 700;
  white-space: nowrap;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transform: scale(0.95);
}

.corner-badge.alive {
  background: #28a745;
  color: white;
}

.corner-badge.out {
  background: #dc3545;
  color: white;
}

.player-result-sequence {
  margin-top: 6px;
  font-size: 0.85em;
  font-weight: 600;
  color: #666;
}

.no-players {
  grid-column: 1 / -1;
  text-align: center;
  padding: 15px;
  color: #999;
  font-style: italic;
}

.btn-close {
  width: 100%;
  padding: 12px;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1em;
  font-weight: bold;
  transition: all 0.3s;
}

.btn-close:hover {
  background: #5a6268;
  transform: translateY(-2px);
}
</style>
