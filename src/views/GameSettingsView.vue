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

      <!-- 游戏选择器 -->
      <div class="game-selector">
        <h3>🎯 选择游戏</h3>
        <select
          v-model="selectedGameId"
          @change="onGameChange"
          class="game-select"
          :disabled="isLoading"
        >
          <option
            v-for="game in gameList"
            :key="game.id"
            :value="game.id"
          >
            {{ game.icon }} {{ game.name }}
          </option>
        </select>
      </div>

      <!-- 当前选择游戏的配置 -->
      <div v-if="currentGame" class="game-config-section">
        <h3>📋 {{ currentGame.name }} 配置</h3>
        <p class="game-description">{{ currentGame.description }}</p>

        <div class="config-content">
          <DynamicConfigRenderer
            :schema="currentSchema"
            v-model="config"
          />
        </div>
      </div>

      <!-- 尚未实现的游戏 -->
      <div v-else class="coming-soon">
        <p>该游戏的配置界面正在开发中...</p>
      </div>

      <!-- 底部操作按钮 -->
      <div class="action-buttons">
        <button class="btn-cancel" @click="goBack">取消</button>
        <button class="btn-reset" @click="resetConfig">重置为默认</button>
        <button
          class="btn-save"
          @click="saveAll"
          :disabled="isLoading || !isConfigValid"
        >
          {{ isLoading ? '保存中...' : '✓ 保存配置' }}
        </button>
      </div>

      <!-- 保存状态提示 -->
      <div v-if="saveStatus" class="save-status" :class="{ success: isSaveSuccess, error: !isSaveSuccess }">
        {{ saveStatus }}
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGameRegistry } from '../composables/useGameRegistry'
import { useGameConfig } from '../composables/useGameConfig'
import DynamicConfigRenderer from '../components/DynamicConfigRenderer.vue'

export default {
  name: 'GameSettingsView',
  components: {
    DynamicConfigRenderer
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    const roomId = route.params.roomId

    const { gameList, getGameConfig } = useGameRegistry()
    const {
      config,
      selectedGameId,
      isLoading,
      loadConfig,
      saveConfig,
      resetConfig: resetToDefault,
      switchGame,
      currentSchema
    } = useGameConfig(roomId)

    const saveStatus = ref('')
    const isSaveSuccess = ref(false)
    const currentPlayerId = ref(null)

    const currentGame = computed(() => {
      return selectedGameId.value ? getGameConfig(selectedGameId.value) : null
    })

    const isConfigValid = computed(() => {
      // 基本验证：所有必填项都有值
      if (!currentGame.value) return false
      const schema = currentGame.value.configSchema
      return Object.keys(schema).every(key => {
        const field = schema[key]
        if (!field.required) return true
        return config.value[key] !== undefined && config.value[key] !== null && config.value[key] !== ''
      })
    })

    // 游戏选择变更
    const onGameChange = () => {
      console.log('游戏选择变更:', selectedGameId.value)
      switchGame(selectedGameId.value)
    }

    // 保存所有配置
    const saveAll = async () => {
      try {
        saveStatus.value = '保存中...'
        isSaveSuccess.value = false

        await saveConfig(currentPlayerId.value)

        saveStatus.value = '✓ 配置已保存'
        isSaveSuccess.value = true

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
        resetToDefault()
      }
    }

    // 返回大厅
    const goBack = () => {
      router.push(`/lobby/${roomId}`)
    }

    // 检查权限
    const checkPermission = () => {
      const playerId = localStorage.getItem('playerId')
      if (!playerId) {
        alert('未找到玩家信息，返回首页')
        router.push('/')
        return false
      }
      currentPlayerId.value = playerId
      return true
    }

    onMounted(async () => {
      if (!checkPermission()) return

      try {
        await loadConfig()
      } catch (error) {
        alert('加载数据失败，请重试')
        router.push(`/lobby/${roomId}`)
      }
    })

    return {
      roomId,
      gameList,
      config,
      selectedGameId,
      currentGame,
      currentSchema,
      isLoading,
      saveStatus,
      isSaveSuccess,
      isConfigValid,
      onGameChange,
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
  position: relative;
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
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 16px center;
  padding-right: 40px;
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
  margin-bottom: 10px;
}

.game-description {
  color: #666;
  font-size: 0.95em;
  margin-bottom: 20px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 8px;
}

.config-content {
  background: #f8f9fa;
  padding: 25px;
  border-radius: 12px;
}

.coming-soon {
  text-align: center;
  padding: 40px;
  color: #999;
  font-style: italic;
  background: #f8f9fa;
  border-radius: 12px;
  margin-bottom: 30px;
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

.btn-save:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
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
