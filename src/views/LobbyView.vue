<template>
  <div id="lobby">
    <div class="lobby-container">
      <!-- 房间信息头部 -->
      <div class="room-header">
        <h1>🏠 房间大厅</h1>
        <div class="room-info">
          <div class="room-id">
            房间号：<strong>{{ roomId }}</strong>
          </div>
          <button v-if="isHost" class="btn-copy" @click="copyRoomId">📋 复制</button>
        </div>
        <div class="player-name">
          你的昵称：<strong>{{ playerName }}</strong>
          <span v-if="isHost" class="host-badge">👑 房主</span>
        </div>
      </div>

      <!-- 邀请区域（仅房主可见） -->
      <div v-if="isHost" class="invite-section">
        <h3>📱 邀请玩家</h3>
        <div class="qr-code-container">
          <canvas ref="qrCanvas" class="qr-canvas"></canvas>
        </div>
        <p class="hint">或分享房间号：{{ roomId }}</p>
      </div>

      <!-- 玩家列表 -->
      <div class="players-section">
        <h3>👥 玩家列表 ({{ players.length }})</h3>
        <div class="players-list">
          <div v-for="player in players" :key="player.id" class="player-item">
            <div class="player-info">
              <span class="player-name">{{ player.name }}</span>
              <span v-if="player.id === hostId" class="host-indicator">👑</span>
            </div>
          </div>
          <div v-if="players.length === 0" class="empty-state">
            {{ isHost ? '等待玩家加入...' : '正在加入房间...' }}
          </div>
        </div>
      </div>

      <!-- 开始游戏按钮（仅房主可见） -->
      <div v-if="isHost" class="actions">
        <button
          class="btn btn-primary btn-start"
          @click="startGame"
          :disabled="players.length < 2"
        >
          开始游戏
        </button>
        <div v-if="players.length < 2" class="hint">
          需要至少 2 名玩家才能开始游戏
        </div>
      </div>

      <!-- 玩家等待状态（仅玩家可见） -->
      <div v-else class="waiting-status">
        <p>⏳ 等待房主开始游戏...</p>
      </div>

      <!-- 退出按钮 -->
      <div class="exit-section">
        <button class="btn btn-exit" @click="exitLobby">🚪 退出房间</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { database } from '../firebase'
import { ref as dbRef, onValue, set, update, remove } from 'firebase/database'
import QRCode from 'qrcode'

export default {
  name: 'LobbyView',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const roomId = route.params.roomId

    const playerName = ref('')
    const isHost = ref(false)
    const players = ref([])
    const qrCanvas = ref(null)
    const hostId = ref(null) // 房主的玩家ID
    const currentPlayerId = ref(null) // 当前玩家的ID

    let playersRef = null
    let unsubscribe = null
    let roomRef = null // 房间信息引用

    // 生产环境调试控制
    const DEBUG = import.meta.env.MODE === 'development'
    const log = (...args) => {
      if (DEBUG) console.log(...args)
    }

    // Firebase操作重试机制
    const retryOperation = async (operation, maxRetries = 3, delay = 1000) => {
      let lastError
      for (let i = 0; i < maxRetries; i++) {
        try {
          return await operation()
        } catch (error) {
          lastError = error
          if (DEBUG) console.warn(`Firebase操作失败，第${i + 1}次重试:`, error.message)
          if (i < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
          }
        }
      }
      throw lastError
    }

    // 检查是否为房主（通过比较玩家ID）
    const checkIsHost = () => {
      console.log('🔍 检查房主权限:', {
        currentPlayerId: currentPlayerId.value,
        hostId: hostId.value,
        playerName: playerName.value,
        roomId: roomId
      })

      const result = currentPlayerId.value && hostId.value && currentPlayerId.value === hostId.value
      isHost.value = result

      if (DEBUG) {
        console.log('✅ 房主权限检查结果:', result ? '✅ 是房主' : '❌ 不是房主')
      }
    }

    // 生成二维码
    const generateQRCode = async () => {
      if (!qrCanvas.value) {
        if (DEBUG) console.error('❌ Canvas 元素未准备好')
        return
      }

      if (!isHost.value) {
        if (DEBUG) console.log('⏭️ 非房主，不生成二维码')
        return
      }

      const joinUrl = `${window.location.origin}/?room=${roomId}`

      const options = {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }

      try {
        if (DEBUG) console.log('⏳ 生成二维码中...')
        await QRCode.toCanvas(qrCanvas.value, joinUrl, options)
        if (DEBUG) console.log('✅ 二维码生成成功')
      } catch (err) {
        if (DEBUG) console.error('❌ 二维码生成失败:', err)
        if (qrCanvas.value) {
          const ctx = qrCanvas.value.getContext('2d')
          ctx.fillStyle = '#ff0000'
          ctx.fillRect(0, 0, 200, 200)
          ctx.fillStyle = '#ffffff'
          ctx.font = 'bold 16px Arial'
          ctx.textAlign = 'center'
          ctx.fillText('ERROR', 100, 100)
          ctx.fillText('See Console', 100, 120)
        }
      }
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

    // 初始化玩家
    const initPlayer = async () => {
      // 从 localStorage 获取玩家信息
      playerName.value = localStorage.getItem('playerName') || ''
      let playerId = localStorage.getItem('playerId')

      if (!playerName.value) {
        alert('未找到玩家信息，返回首页')
        router.push('/')
        return
      }

      try {
        // 检查是否已存在该玩家（使用重试机制）
        const roomPlayersRef = dbRef(database, `rooms/${roomId}/players`)
        const existingPlayerSnapshot = await retryOperation(
          () => new Promise((resolve) => {
            const unsubscribeCheck = onValue(roomPlayersRef, (snapshot) => {
              unsubscribeCheck()
              resolve(snapshot)
            }, { onlyOnce: true })
          })
        )

        const existingData = existingPlayerSnapshot.val()
        let currentPlayer = null

        // 如果玩家ID存在且在玩家列表中，则重用
        if (playerId && existingData && existingData[playerId]) {
          currentPlayer = existingData[playerId]
          console.log('♻️ 重用现有玩家身份:', currentPlayer.name)
          // 确保localStorage中的玩家ID是最新的
          localStorage.setItem('playerId', playerId)
        } else {
          // 创建新玩家（可能是首次加入或重新加入）
          // 如果有旧的playerId但不在列表中，生成新的ID
          const newPlayerId = Date.now().toString() + Math.random().toString(36).substring(7)
          playerId = newPlayerId

          currentPlayer = {
            id: playerId,
            name: playerName.value,
            score: 0,
            joinedAt: Date.now()
          }

          console.log('✨ 创建新玩家:', currentPlayer)

          // 写入 Firebase（使用重试机制）
          const newPlayerRef = dbRef(database, `rooms/${roomId}/players/${playerId}`)
          await retryOperation(() => set(newPlayerRef, currentPlayer))

          // 保存玩家ID到 localStorage
          localStorage.setItem('playerId', playerId)
        }

        // 关键修复：提前设置 currentPlayerId，确保在注册监听器前已设置
        currentPlayerId.value = playerId
        console.log('✅ currentPlayerId 设置完成:', currentPlayerId.value)

        // 监听玩家列表变化
        const unsubscribePlayers = onValue(roomPlayersRef, (snapshot) => {
          const data = snapshot.val()
          if (data) {
            players.value = Object.values(data).sort((a, b) => a.joinedAt - b.joinedAt)
          } else {
            players.value = []
          }
        })

        // 监听房间信息（房主ID等）
        roomRef = dbRef(database, `rooms/${roomId}`)
        const unsubscribeRoom = onValue(roomRef, async (snapshot) => {
          const roomData = snapshot.val()

          console.log('🏠 房间监听器触发:', roomData ? '房间存在' : '房间不存在')

          if (roomData && roomData.hostId) {
            // 房间已存在，有房主
            hostId.value = roomData.hostId
            checkIsHost()
          } else if (roomData && !roomData.hostId) {
            // 房间存在但无房主（如数据未初始化），当前玩家成为房主
            if (!currentPlayerId.value) {
              console.error('❌ 房间初始化失败：currentPlayerId 尚未设置')
              return
            }

            console.log('✨ 房间无房主，当前玩家成为房主，ID:', currentPlayerId.value)

            // 立即更新本地状态
            hostId.value = currentPlayerId.value
            checkIsHost()

            try {
              await retryOperation(() => update(roomRef, {
                hostId: currentPlayerId.value,
                createdAt: Date.now(),
                gameStatus: 'waiting'
              }))
              console.log('✅ 房间房主设置成功，hostId:', currentPlayerId.value)
            } catch (error) {
              console.error('❌ 设置房主失败:', error)
              hostId.value = null
              checkIsHost()
            }
          } else if (!roomData) {
            // 房间不存在，创建房间并设置房主

            // 关键修复：确保 currentPlayerId 已设置
            if (!currentPlayerId.value) {
              console.error('❌ 房间创建失败：currentPlayerId 尚未设置')
              return
            }

            console.log('✨ 房间不存在，创建房间，房主ID:', currentPlayerId.value)

            // 立即更新本地状态，让用户立即看到房主标识
            hostId.value = currentPlayerId.value
            checkIsHost()

            try {
              await retryOperation(() => update(roomRef, {
                hostId: currentPlayerId.value,
                createdAt: Date.now(),
                gameStatus: 'waiting'
              }))
              console.log('✅ 房间创建成功，hostId:', currentPlayerId.value)
            } catch (error) {
              console.error('❌ 创建房间失败:', error)
              // 如果创建失败，重置房主状态
              hostId.value = null
              checkIsHost()
            }
          }
        })

        // 保存 unsubscribe 函数以便清理
        unsubscribe = () => {
          unsubscribePlayers()
          unsubscribeRoom()
        }
      } catch (error) {
        if (DEBUG) console.error('初始化玩家失败:', error)
        alert('连接服务器失败，请检查网络连接或联系房主。错误：' + error.message)
        router.push('/')
      }
    }

    // 开始游戏
    const startGame = async () => {
      if (players.value.length < 2) {
        alert('需要至少 2 名玩家才能开始游戏')
        return
      }

      try {
        // 设置第一个玩家为当前回合（使用重试机制）
        await retryOperation(() => update(dbRef(database, `rooms/${roomId}`), {
          currentTurn: players.value[0].id,
          gameStatus: 'playing'
        }))

        // 跳转到游戏页面
        router.push(`/game/${roomId}`)
      } catch (error) {
        if (DEBUG) console.error('开始游戏失败:', error)
        alert('开始游戏失败：' + error.message)
      }
    }

    // 退出房间
    const exitLobby = async () => {
      if (confirm('确定要退出房间吗？')) {
        try {
          // 清理玩家数据（使用重试机制）
          const currentPlayer = players.value.find(p => p.name === playerName.value)
          if (currentPlayer) {
            const playerRef = dbRef(database, `rooms/${roomId}/players/${currentPlayer.id}`)
            await retryOperation(() => remove(playerRef))
          }

          // 清理 localStorage
          localStorage.removeItem('playerName')
          localStorage.removeItem('isHost')
          localStorage.removeItem('roomId')
          localStorage.removeItem('playerId')

          // 返回首页
          router.push('/')
        } catch (error) {
          if (DEBUG) console.error('退出房间失败:', error)
          alert('退出房间失败：' + error.message)
        }
      }
    }

    // 监听房主权限变化，自动生成二维码
    watch(isHost, async (newValue) => {
      if (newValue) {
        // 等待 DOM 更新完成
        await nextTick()
        if (qrCanvas.value) {
          generateQRCode()
        }
      }
    })

    onMounted(async () => {
      await initPlayer()

      // 等待 DOM 更新
      await nextTick()

      // 等待 Canvas 准备就绪（最多重试 10 次，防止无限循环）
      let retryCount = 0
      const maxRetries = 10
      const waitForCanvas = async () => {
        // 只有房主才需要等待二维码
        if (isHost.value && !qrCanvas.value && retryCount < maxRetries) {
          retryCount++
          await nextTick() // 等待 DOM 更新
          setTimeout(waitForCanvas, 200)
        } else if (isHost.value && qrCanvas.value) {
          // Canvas 准备好且是房主，生成二维码
          generateQRCode()
        }
      }

      // 开始等待
      await waitForCanvas()
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
      hostId,
      qrCanvas,
      copyRoomId,
      startGame,
      exitLobby
    }
  }
}
</script>

<style scoped>
#lobby {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.lobby-container {
  max-width: 800px;
  margin: 0 auto;
  background: white;
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.room-header {
  text-align: center;
  margin-bottom: 30px;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 20px;
}

.room-header h1 {
  color: #333;
  margin-bottom: 20px;
}

.room-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 15px;
  font-size: 1.2em;
}

.room-id strong {
  color: #42b983;
  font-size: 1.3em;
  letter-spacing: 2px;
}

.btn-copy {
  padding: 8px 16px;
  background-color: #f0f0f0;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1em;
}

.btn-copy:hover {
  background-color: #e0e0e0;
}

.player-name {
  font-size: 1.1em;
  color: #666;
}

.host-badge {
  margin-left: 10px;
  padding: 4px 12px;
  background-color: #ffd700;
  border-radius: 12px;
  font-size: 0.9em;
}

.invite-section {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 30px;
  text-align: center;
}

.invite-section h3 {
  margin-bottom: 15px;
  color: #333;
}

.qr-code-container {
  display: flex;
  justify-content: center;
  margin: 20px 0;
}

.qr-canvas {
  width: 200px;
  height: 200px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 3px solid #42b983;
}

.hint {
  color: #999;
  font-size: 0.9em;
  margin-top: 10px;
}

.players-section h3 {
  color: #333;
  margin-bottom: 15px;
}

.players-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.player-item {
  padding: 15px 20px;
  background: #f8f9fa;
  border-radius: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.player-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.player-name {
  font-size: 1.1em;
  color: #333;
}

.host-indicator {
  font-size: 1.3em;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #999;
  font-style: italic;
}

.actions {
  margin-top: 30px;
  text-align: center;
}

.btn {
  padding: 15px 50px;
  font-size: 1.3em;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary {
  background-color: #42b983;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #359268;
}

.btn-primary:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.btn-start {
  margin-bottom: 10px;
}

.waiting-status {
  margin-top: 30px;
  text-align: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 10px;
}

.waiting-status p {
  color: #666;
  font-size: 1.1em;
}

.exit-section {
  margin-top: 30px;
  text-align: center;
}

.btn-exit {
  padding: 10px 30px;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.btn-exit:hover {
  background-color: #c82333;
}
</style>