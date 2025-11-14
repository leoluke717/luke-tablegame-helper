<template>
  <header class="game-header">
    <div class="header-content">
      <h1>🎯 屁者先知</h1>
      <div class="player-info" v-if="currentPlayer">
        <div class="player-avatar">{{ currentPlayer.avatar || '😊' }}</div>
        <div class="player-details">
          <span class="player-name">{{ currentPlayer.name }}</span>
          <div class="player-badges">
            <span v-if="currentPlayer.identity" class="player-identity-badge">
              {{ getIdentityText(currentPlayer.identity) }}
            </span>
            <span v-if="currentPlayer.status === 'out'" class="status-eliminated">
              💀 已出局
            </span>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script>
import { PLAYER_IDENTITY } from '../../../config/games/piZheXianZhiDataModel'

export default {
  name: 'GameHeader',
  props: {
    roomId: {
      type: String,
      required: true
    },
    currentPlayer: {
      type: Object,
      default: null
    }
  },
  emits: ['copy-room-id'],
  setup(props, { emit }) {
    const copyRoomId = async () => {
      emit('copy-room-id')
    }

    const getIdentityText = (identity) => {
      return identity === PLAYER_IDENTITY.ASSASSIN ? '💨 屁者' : '👤 乘客'
    }

    return {
      copyRoomId,
      getIdentityText
    }
  }
}
</script>

<style scoped>
.game-header {
  background: white;
  padding: 12px 20px;
  border-radius: 12px;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.game-header h1 {
  margin: 0;
  color: #333;
  font-size: 1.3em;
  text-align: center;
}

.player-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

/* 玩家头像样式 */
.player-avatar {
  font-size: 1.8em;
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
}

.player-details {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
}

.player-name {
  font-weight: 600;
  color: #333;
  font-size: 1em;
  white-space: nowrap;
}

.player-badges {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* 身份徽章样式 */
.player-identity-badge {
  padding: 3px 10px;
  border-radius: 10px;
  font-size: 0.75em;
  font-weight: 600;
  background-color: #42b983;
  color: #fff;
  white-space: nowrap;
}

.status-eliminated {
  padding: 3px 10px;
  background: #ffebee;
  border-radius: 10px;
  color: #e74c3c;
  font-weight: 600;
  font-size: 0.75em;
  white-space: nowrap;
}
</style>
