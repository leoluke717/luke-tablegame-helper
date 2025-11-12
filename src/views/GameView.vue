<template>
  <div id="game">
    <div class="game-container">
      <!-- 游戏头部 -->
      <div class="game-header">
        <h1>🎮 游戏进行中</h1>
        <div class="room-info">
          房间号：<strong>{{ roomId }}</strong>
          <button class="btn-copy" @click="copyRoomId">📋 复制</button>
        </div>
      </div>

      <!-- 游戏状态 -->
      <div class="game-status">
        <h2>当前回合：<span class="current-player">{{ currentPlayerName || '等待中...' }}</span></h2>
      </div>

      <!-- 玩家计分板 -->
      <div class="scoreboard">
        <h3>📊 计分板</h3>
        <div class="scores">
          <div v-for="player in players" :key="player.id" class="score-item" :class="{ active: player.id === currentPlayerId }">
            <div class="player-info">
              <span class="player-name">{{ player.name }}</span>
              <span v-if="player.id === hostId" class="host-indicator">👑</span>
              <span v-if="player.id === currentPlayerId" class="turn-indicator">✓</span>
            </div>
            <div class="score">{{ player.score }}</div>
          </div>
        </div>
      </div>

      <!-- 操作按钮区域 -->
      <div class="actions">
        <button v-if="isHost" class="btn btn-action" @click="endTurn">
          ⏭️ 结束回合
        </button>
        <button class="btn btn-exit" @click="exitGame">
          🚪 退出游戏
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { database } from '../firebase'
import { ref as dbRef, onValue, update } from 'firebase/database'

export default {
  name: 'GameView',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const roomId = route.params.roomId

    const playerName = ref('')
    const isHost = ref(false)
    const players = ref([])
    const currentPlayerId = ref(null)
    const currentPlayerName = ref('')
    const hostId = ref(null) // 房主的玩家ID
    const myPlayerId = ref(null) // 当前玩家的ID

    let roomRef = null
    let unsubscribe = null

    // 生产环境调试控制
    const DEBUG = import.meta.env.MODE === 'development'
    const log = (...args) => {
      if (DEBUG) console.log(...args)
    }

    // 复制房间号
    const copyRoomId = async () => {
      try {
        await navigator.clipboard.writeText(roomId)
        alert('房间号已复制到剪贴板！')
      } catch (err) {
        alert('复制失败，请手动复制')
      }
    }

    // 检查是否为房主（通过比较玩家ID）
    const checkIsHost = () => {
      isHost.value = myPlayerId.value && hostId.value && myPlayerId.value === hostId.value
    }

    // 初始化游戏状态
    const initGame = async () => {
      // 从 localStorage 获取玩家信息
      playerName.value = localStorage.getItem('playerName') || ''
      const savedPlayerId = localStorage.getItem('playerId')

      if (!playerName.value) {
        alert('未找到玩家信息，返回首页')
        router.push('/')
        return
      }

      try {
        // 监听游戏状态
        roomRef = dbRef(database, `rooms/${roomId}`)
        unsubscribe = onValue(roomRef, (snapshot) => {
          const data = snapshot.val()
          if (data) {
            if (data.players) {
              players.value = Object.values(data.players).sort((a, b) => a.joinedAt - b.joinedAt)

              // 找到当前玩家ID
              const me = players.value.find(p => p.name === playerName.value)
              if (me) {
                myPlayerId.value = me.id
              }
            }
            // 更新房主ID
            if (data.hostId) {
              hostId.value = data.hostId
              checkIsHost()
            }
            if (data.currentTurn) {
              currentPlayerId.value = data.currentTurn
              const currentPlayer = players.value.find(p => p.id === currentPlayerId.value)
              if (currentPlayer) {
                currentPlayerName.value = currentPlayer.name
              }
            } else if (players.value.length > 0) {
              // 默认第一个玩家为当前玩家
              currentPlayerId.value = players.value[0].id
              currentPlayerName.value = players.value[0].name
            }
          }
        })
      } catch (error) {
        if (DEBUG) console.error('初始化游戏状态失败:', error)
        alert('连接服务器失败：' + error.message)
        router.push(`/lobby/${roomId}`)
      }
    }

    // 结束回合（房主功能）
    const endTurn = async () => {
      if (!isHost.value) {
        alert('只有房主可以结束回合')
        return
      }

      try {
        const currentIndex = players.value.findIndex(p => p.id === currentPlayerId.value)
        const nextIndex = (currentIndex + 1) % players.value.length
        const nextPlayerId = players.value[nextIndex].id

        await update(roomRef, {
          currentTurn: nextPlayerId
        })
      } catch (error) {
        if (DEBUG) console.error('结束回合失败:', error)
        alert('操作失败：' + error.message)
      }
    }

    // 退出游戏
    const exitGame = () => {
      if (confirm('确定要退出游戏吗？')) {
        router.push(`/lobby/${roomId}`)
      }
    }

    onMounted(() => {
      initGame()
    })

    onUnmounted(() => {
      if (unsubscribe) {
        unsubscribe()
      }
    })

    return {
      roomId,
      playerName,
      isHost,
      players,
      currentPlayerId,
      currentPlayerName,
      hostId,
      copyRoomId,
      endTurn,
      exitGame
    }
  }
}
</script>

<style scoped>
#game {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.game-container {
  max-width: 800px;
  margin: 0 auto;
  background: white;
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.game-header {
  text-align: center;
  margin-bottom: 30px;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 20px;
}

.game-header h1 {
  color: #333;
  margin-bottom: 20px;
}

.room-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 1.1em;
}

.room-info strong {
  color: #42b983;
  font-size: 1.2em;
  letter-spacing: 2px;
}

.btn-copy {
  padding: 6px 12px;
  background-color: #f0f0f0;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9em;
}

.btn-copy:hover {
  background-color: #e0e0e0;
}

.game-status {
  text-align: center;
  margin-bottom: 30px;
  padding: 20px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  border-radius: 12px;
  color: white;
}

.game-status h2 {
  margin: 0;
  font-size: 1.5em;
}

.current-player {
  font-weight: bold;
  text-decoration: underline;
}

.scoreboard {
  margin-bottom: 30px;
}

.scoreboard h3 {
  color: #333;
  margin-bottom: 15px;
  font-size: 1.3em;
}

.scores {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.score-item {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s;
}

.score-item.active {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.player-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.player-name {
  font-size: 1.2em;
  color: #333;
  font-weight: 500;
}

.host-indicator {
  font-size: 1.3em;
}

.turn-indicator {
  margin-left: 5px;
  color: #42b983;
  font-weight: bold;
  font-size: 1.2em;
}

.score {
  font-size: 2em;
  font-weight: bold;
  color: #42b983;
}

.actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  padding: 12px 30px;
  font-size: 1.1em;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-action {
  background-color: #42b983;
  color: white;
}

.btn-action:hover {
  background-color: #359268;
}

.btn-exit {
  background-color: #dc3545;
  color: white;
}

.btn-exit:hover {
  background-color: #c82333;
}
</style>