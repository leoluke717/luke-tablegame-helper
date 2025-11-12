<template>
  <div id="game-settings">
    <div class="settings-container">
      <!-- 页面头部 -->
      <div class="settings-header">
        <button class="btn-back" @click="goBack">
          ← 返回大厅
        </button>
        <h1>⚙️ 游戏设置</h1>
        <div class="room-info">
          房间号：<strong>{{ roomId }}</strong>
        </div>
      </div>

      <!-- 当前选择的游戏 -->
      <div class="current-game">
        <h3>当前选择：{{ selectedGame || '未选择' }}</h3>
      </div>

      <!-- 游戏选择器 -->
      <div class="game-selector">
        <h3>🎯 选择游戏</h3>
        <select v-model="selectedGame" @change="onGameChange" class="game-select">
          <option value="piZheXianZhi">屁者先知</option>
          <!-- 未来游戏选项将在这里添加 -->
        </select>
      </div>

      <!-- 游戏配置区域 -->
      <div class="game-config-section">
        <h3>📋 游戏参数配置</h3>

        <!-- 屁者先知配置 -->
        <div v-if="selectedGame === 'piZheXianZhi'" class="config-content">
          <div class="config-item">
            <label>回合时间限制</label>
            <select v-model="gameConfig.turnTimeLimit" @change="saveConfig" class="config-select">
              <option :value="30">30秒</option>
              <option :value="60">60秒</option>
              <option :value="90">90秒</option>
              <option :value="0">无限制</option>
            </select>
          </div>

          <div class="config-item">
            <label>胜利得分</label>
            <select v-model="gameConfig.victoryScore" @change="saveConfig" class="config-select">
              <option :value="100">100分</option>
              <option :value="150">150分</option>
              <option :value="200">200分</option>
              <option :value="300">300分</option>
            </select>
          </div>

          <div class="config-item">
            <label>启用惩罚卡</label>
            <input
              type="checkbox"
              v-model="gameConfig.enablePenalty"
              @change="saveConfig"
              class="config-checkbox"
            />
          </div>

          <div class="config-item">
            <label>难度等级</label>
            <select v-model="gameConfig.difficulty" @change="saveConfig" class="config-select">
              <option value="easy">简单</option>
              <option value="medium">中等</option>
              <option value="hard">困难</option>
            </select>
          </div>

          <div class="config-item">
            <label>支持玩家数量</label>
            <select v-model="gameConfig.playerCount" @change="saveConfig" class="config-select">
              <option :value="3">3人</option>
              <option :value="4">4人</option>
              <option :value="5">5人</option>
              <option :value="6">6人</option>
              <option :value="7">7人</option>
              <option :value="8">8人</option>
            </select>
          </div>
        </div>

        <!-- 其他游戏的配置将动态加载到这里 -->
        <div v-else class="coming-soon">
          <p>该游戏的配置界面正在开发中...</p>
        </div>
      </div>

      <!-- 底部操作按钮 -->
      <div class="action-buttons">
        <button class="btn-cancel" @click="goBack">取消</button>
        <button class="btn-reset" @click="resetConfig">重置为默认</button>
        <button class="btn-save" @click="saveAll">✓ 保存配置</button>
      </div>

      <!-- 保存状态提示 -->
      <div v-if="saveStatus" class="save-status" :class="{ success: isSaveSuccess, error: !isSaveSuccess }">
        {{ saveStatus }}
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { database } from '../firebase'
import { ref as dbRef, onValue, set, update } from 'firebase/database'

export default {
  name: 'GameSettingsView',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const roomId = route.params.roomId

    const selectedGame = ref('piZheXianZhi') // 默认游戏
    const saveStatus = ref('')
    const isSaveSuccess = ref(false)
    const isHost = ref(false)
    const hostId = ref(null)
    const currentPlayerId = ref(null)
    let roomInfoRef = null
    let unsubscribeRoom = null

    // 默认配置
    const defaultConfig = {
      gameType: 'piZheXianZhi',
      turnTimeLimit: 60,
      victoryScore: 150,
      enablePenalty: true,
      difficulty: 'medium',
      playerCount: 4,
      updatedAt: Date.now(),
      updatedBy: ''
    }

    const gameConfig = ref({ ...defaultConfig })

    // 检查是否为房主
    const checkIsHost = () => {
      const result = currentPlayerId.value && hostId.value && currentPlayerId.value === hostId.value
      isHost.value = result
      if (!isHost.value) {
        alert('❌ 您没有权限访问游戏设置')
        router.push(`/lobby/${roomId}`)
      }
    }

    // 初始化数据
    const initData = async () => {
      try {
        // 检查权限
        const playerId = localStorage.getItem('playerId')
        if (!playerId) {
          alert('未找到玩家信息，返回首页')
          router.push('/')
          return
        }
        currentPlayerId.value = playerId

        // 一次性读取房间信息，避免实时监听造成与大厅页面冲突
        roomInfoRef = dbRef(database, `rooms/${roomId}`)
        const snapshot = await new Promise((resolve) => {
          const unsubscribe = onValue(roomInfoRef, (snap) => {
            unsubscribe()
            resolve(snap)
          }, { onlyOnce: true })
        })

        const data = snapshot.val()
        if (data) {
          hostId.value = data.hostId
          checkIsHost()

          // 读取已保存的游戏选择
          if (data.selectedGame) {
            selectedGame.value = data.selectedGame
          }

          // 读取已保存的游戏配置
          if (data.gameSettings) {
            gameConfig.value = { ...defaultConfig, ...data.gameSettings }
          }
        }
      } catch (error) {
        console.error('初始化数据失败:', error)
        alert('加载数据失败，请重试')
      }
    }

    // 游戏选择变更
    const onGameChange = () => {
      console.log('游戏选择变更:', selectedGame.value)
      // 保存到Firebase
      const roomRef = dbRef(database, `rooms/${roomId}`)
      update(roomRef, {
        selectedGame: selectedGame.value
      })
    }

    // 保存配置
    const saveConfig = () => {
      const config = {
        ...gameConfig.value,
        gameType: selectedGame.value,
        updatedAt: Date.now(),
        updatedBy: currentPlayerId.value
      }
      gameConfig.value = config
    }

    // 保存所有配置
    const saveAll = async () => {
      try {
        saveStatus.value = '保存中...'
        isSaveSuccess.value = false

        const roomRef = dbRef(database, `rooms/${roomId}`)
        const config = {
          ...gameConfig.value,
          gameType: selectedGame.value,
          updatedAt: Date.now(),
          updatedBy: currentPlayerId.value
        }

        await update(roomRef, {
          selectedGame: selectedGame.value,
          gameSettings: config
        })

        saveStatus.value = '✓ 配置已保存'
        isSaveSuccess.value = true

        // 保存成功后返回大厅
        setTimeout(() => {
          router.push(`/lobby/${roomId}`)
        }, 1500)
      } catch (error) {
        console.error('保存配置失败:', error)
        saveStatus.value = '✗ 保存失败：' + error.message
        isSaveSuccess.value = false

        setTimeout(() => {
          saveStatus.value = ''
        }, 3000)
      }
    }

    // 重置为默认配置
    const resetConfig = () => {
      if (confirm('确定要重置为默认配置吗？')) {
        gameConfig.value = { ...defaultConfig }
        selectedGame.value = 'piZheXianZhi'
        saveAll()
      }
    }

    // 返回大厅
    const goBack = () => {
      router.push(`/lobby/${roomId}`)
    }

    onMounted(() => {
      initData()
    })

    onUnmounted(() => {
      // 清理监听器（虽然我们使用的是 onlyOnce，但为了保险起见）
      if (unsubscribeRoom) {
        unsubscribeRoom()
      }
    })

    return {
      roomId,
      selectedGame,
      gameConfig,
      saveStatus,
      isSaveSuccess,
      onGameChange,
      saveConfig,
      saveAll,
      resetConfig,
      goBack
    }
  }
}
</script>

<style scoped>
#game-settings {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.settings-container {
  max-width: 800px;
  margin: 0 auto;
  background: white;
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.settings-header {
  text-align: center;
  margin-bottom: 30px;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 20px;
}

.btn-back {
  position: absolute;
  left: 20px;
  padding: 10px 20px;
  background-color: #f0f0f0;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1em;
  transition: all 0.2s;
}

.btn-back:hover {
  background-color: #e0e0e0;
}

.settings-header h1 {
  color: #333;
  margin: 10px 0;
}

.room-info {
  color: #666;
  font-size: 1.1em;
}

.room-info strong {
  color: #42b983;
  letter-spacing: 2px;
}

.current-game {
  background: #f8f9fa;
  padding: 15px 20px;
  border-radius: 10px;
  margin-bottom: 20px;
  text-align: center;
}

.current-game h3 {
  color: #333;
  margin: 0;
}

.game-selector {
  margin-bottom: 30px;
}

.game-selector h3 {
  color: #333;
  margin-bottom: 15px;
}

.game-select {
  width: 100%;
  padding: 12px 16px;
  font-size: 1.1em;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  outline: none;
  cursor: pointer;
  transition: all 0.2s;
  box-sizing: border-box;
}

.game-select:focus {
  border-color: #42b983;
  box-shadow: 0 0 0 3px rgba(66, 185, 131, 0.1);
}

.game-config-section {
  margin-bottom: 30px;
}

.game-config-section h3 {
  color: #333;
  margin-bottom: 20px;
}

.config-content {
  background: #f8f9fa;
  padding: 25px;
  border-radius: 12px;
}

.config-item {
  margin-bottom: 20px;
}

.config-item label {
  display: block;
  margin-bottom: 8px;
  color: #555;
  font-weight: 500;
}

.config-select {
  width: 100%;
  padding: 10px 14px;
  font-size: 1em;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  outline: none;
  cursor: pointer;
  transition: all 0.2s;
  box-sizing: border-box;
}

.config-select:focus {
  border-color: #42b983;
  box-shadow: 0 0 0 3px rgba(66, 185, 131, 0.1);
}

.config-checkbox {
  width: 24px;
  height: 24px;
  cursor: pointer;
}

.coming-soon {
  text-align: center;
  padding: 40px;
  color: #999;
  font-style: italic;
}

.action-buttons {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-top: 30px;
}

.btn-cancel,
.btn-reset,
.btn-save {
  padding: 12px 30px;
  font-size: 1.1em;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: bold;
}

.btn-cancel {
  background-color: #f5f5f5;
  color: #666;
}

.btn-cancel:hover {
  background-color: #eeeeee;
}

.btn-reset {
  background-color: #fff3cd;
  color: #856404;
  border: 2px solid #ffc107;
}

.btn-reset:hover {
  background-color: #ffe69c;
}

.btn-save {
  background-color: #42b983;
  color: white;
}

.btn-save:hover {
  background-color: #359268;
}

.save-status {
  margin-top: 20px;
  padding: 12px 20px;
  border-radius: 8px;
  text-align: center;
  font-size: 1em;
  font-weight: bold;
  animation: fadeIn 0.3s ease;
}

.save-status.success {
  background-color: #d4edda;
  color: #155724;
  border: 2px solid #c3e6cb;
}

.save-status.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 2px solid #f5c6cb;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 移动端适配 */
@media (max-width: 768px) {
  .settings-container {
    padding: 20px;
  }

  .btn-back {
    position: static;
    margin-bottom: 15px;
  }

  .action-buttons {
    flex-direction: column;
  }

  .btn-cancel,
  .btn-reset,
  .btn-save {
    width: 100%;
  }
}
</style>