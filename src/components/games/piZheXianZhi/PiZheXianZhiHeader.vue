<template>
  <header class="game-header">
    <div>
      <h1>🎯 屁者先知</h1>
      <div class="room-info">
        <span class="room-id">房间号: {{ roomId }}</span>
        <button class="btn-copy" @click="copyRoomId">📋 复制</button>
      </div>
    </div>
    <div class="player-info" v-if="currentPlayer">
      <span class="player-avatar">{{ currentPlayer.avatar || '😊' }}</span>
      <span class="player-name">{{ currentPlayer.name }}</span>
      <span v-if="currentPlayer.identity" class="player-identity-badge">
        {{ getIdentityText(currentPlayer.identity) }}
      </span>
      <span v-if="currentPlayer.status === 'out'" class="status-eliminated">
        💀 已出局
      </span>
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
  padding: 20px 30px;
  border-radius: 12px;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.game-header h1 {
  margin: 0 0 15px 0;
  color: #333;
  text-align: center;
}

.room-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 10px;
}

.room-id {
  font-weight: bold;
  color: #555;
}

.btn-copy {
  padding: 6px 12px;
  background: #42b983;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9em;
}

.btn-copy:hover {
  background: #359268;
}

.player-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  color: #666;
}

.player-name {
  font-weight: bold;
}

.player-role {
  padding: 4px 12px;
  background: #e3f2fd;
  border-radius: 12px;
  font-size: 0.9em;
}

.status-eliminated {
  padding: 4px 12px;
  background: #ffebee;
  border-radius: 12px;
  color: #e74c3c;
  font-weight: bold;
}

/* 玩家头像样式 */
.player-avatar {
  font-size: 2.2em;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 2px solid #42b983;
  background-color: #fff;
  overflow: hidden;
  text-align: center;
  margin-right: 12px;
}

/* 身份徽章样式 */
.player-identity-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.85em;
  font-weight: 600;
  margin-left: 8px;
  background-color: #42b983;
  color: #fff;
  display: inline-block;
}

/* 游戏头部玩家信息布局 */
.player-info {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
}

.player-name {
  display: inline-block;
  white-space: nowrap;
  margin-right: 8px;
}
</style>
