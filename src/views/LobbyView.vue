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
          <button class="btn-copy" @click="copyRoomId">📋 复制</button>
        </div>
        <div class="player-name">
          你的昵称：<strong>{{ playerName }}</strong>
          <span v-if="isHost" class="host-badge">👑 房主</span>
        </div>
      </div>

      <!-- 邀请区域 -->
      <div class="invite-section">
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
              <span v-if="player.isHost" class="host-indicator">👑</span>
            </div>
          </div>
          <div v-if="players.length === 0" class="empty-state">
            等待玩家加入...
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
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue'
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

    let playersRef = null
    let unsubscribe = null

    // 生成二维码
    const generateQRCode = async () => {
      console.log('=== 开始生成二维码 ===')
      console.log('Canvas 元素:', qrCanvas.value)
      console.log('Canvas 尺寸:', qrCanvas.value?.width, 'x', qrCanvas.value?.height)
      console.log('是否为房主:', isHost.value)
      console.log('房间号:', roomId)

      if (!qrCanvas.value) {
        console.error('❌ Canvas 元素未准备好')
        return
      }

      if (!isHost.value) {
        console.log('⏭️ 非房主，不生成二维码')
        return
      }

      const joinUrl = `${window.location.origin}/?room=${roomId}`
      console.log('✅ 生成的 URL:', joinUrl)
      console.log('✅ URL 长度:', joinUrl.length, '字符')

      const options = {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }
      console.log('✅ QRCode 选项:', options)

      try {
        console.log('🔄 正在调用 QRCode.toCanvas()...')
        await QRCode.toCanvas(qrCanvas.value, joinUrl, options)
        console.log('✅ 二维码生成成功！')
        console.log('Canvas 当前内容:', qrCanvas.value.toDataURL().substring(0, 100) + '...')
      } catch (err) {
        console.error('❌ 二维码生成失败:', err)
        // 在 canvas 区域显示错误信息
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
      console.log('=== 二维码生成结束 ===\n')
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
      isHost.value = localStorage.getItem('isHost') === 'true'
      let playerId = localStorage.getItem('playerId')

      if (!playerName.value) {
        alert('未找到玩家信息，返回首页')
        router.push('/')
        return
      }

      try {
        // 检查是否已存在该玩家
        const roomPlayersRef = dbRef(database, `rooms/${roomId}/players`)
        const existingPlayerSnapshot = await new Promise((resolve) => {
          const unsubscribeCheck = onValue(roomPlayersRef, (snapshot) => {
            unsubscribeCheck()
            resolve(snapshot)
          }, { onlyOnce: true })
        })

        const existingData = existingPlayerSnapshot.val()
        let currentPlayer = null

        // 如果玩家ID存在且在玩家列表中，则重用
        if (playerId && existingData && existingData[playerId]) {
          currentPlayer = existingData[playerId]
        } else {
          // 创建新玩家
          playerId = Date.now().toString() + Math.random().toString(36).substring(7)
          currentPlayer = {
            id: playerId,
            name: playerName.value,
            isHost: isHost.value,
            score: 0,
            joinedAt: Date.now()
          }

          // 写入 Firebase
          const newPlayerRef = dbRef(database, `rooms/${roomId}/players/${playerId}`)
          await set(newPlayerRef, currentPlayer)

          // 保存玩家ID到 localStorage
          localStorage.setItem('playerId', playerId)
        }

        // 监听玩家列表变化
        const unsubscribePlayers = onValue(roomPlayersRef, (snapshot) => {
          const data = snapshot.val()
          if (data) {
            players.value = Object.values(data).sort((a, b) => a.joinedAt - b.joinedAt)
          } else {
            players.value = []
          }
        })

        // 保存 unsubscribe 函数以便清理
        unsubscribe = unsubscribePlayers
      } catch (error) {
        console.error('初始化玩家失败:', error)
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
        // 设置第一个玩家为当前回合
        await update(dbRef(database, `rooms/${roomId}`), {
          currentTurn: players.value[0].id,
          gameStatus: 'playing'
        })

        // 跳转到游戏页面
        router.push(`/game/${roomId}`)
      } catch (error) {
        console.error('开始游戏失败:', error)
        alert('开始游戏失败：' + error.message)
      }
    }

    // 退出房间
    const exitLobby = async () => {
      if (confirm('确定要退出房间吗？')) {
        // 清理玩家数据
        const currentPlayer = players.value.find(p => p.name === playerName.value)
        if (currentPlayer) {
          const playerRef = dbRef(database, `rooms/${roomId}/players/${currentPlayer.id}`)
          await remove(playerRef)
        }

        // 清理 localStorage
        localStorage.removeItem('playerName')
        localStorage.removeItem('isHost')
        localStorage.removeItem('roomId')
        localStorage.removeItem('playerId')

        // 返回首页
        router.push('/')
      }
    }

    onMounted(async () => {
      console.log('🚀 onMounted 被调用')
      await initPlayer()
      console.log('✅ initPlayer 完成')
      console.log('当前 isHost:', isHost.value)

      // 等待 DOM 更新
      await nextTick()
      console.log('✅ 等待 DOM 更新后')
      console.log('当前 qrCanvas:', qrCanvas.value)

      // 等待 Canvas 准备就绪（最多重试 10 次，防止无限循环）
      let retryCount = 0
      const maxRetries = 10
      const waitForCanvas = () => {
        console.log('🔍 检查 Canvas 是否准备就绪...')
        console.log('  - qrCanvas.value:', qrCanvas.value)
        console.log('  - isHost.value:', isHost.value)
        console.log(`  - 重试次数: ${retryCount}/${maxRetries}`)

        if (isHost.value && qrCanvas.value) {
          console.log('✅ 条件满足，生成二维码')
          generateQRCode()
        } else if (isHost.value && !qrCanvas.value && retryCount < maxRetries) {
          retryCount++
          console.log('⏳ 等待 Canvas 准备就绪，200ms 后重试...')
          setTimeout(waitForCanvas, 200)
        } else if (isHost.value && !qrCanvas.value && retryCount >= maxRetries) {
          console.error('❌ Canvas 准备超时，二维码生成失败')
        } else {
          console.log('ℹ️ 非房主，跳过二维码生成')
        }
      }

      // 开始等待
      waitForCanvas()
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