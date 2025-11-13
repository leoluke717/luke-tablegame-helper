import { ref, watch, computed } from 'vue'
import { database } from '../firebase'
import { ref as dbRef, update, get } from 'firebase/database'
import { useGameRegistry } from './useGameRegistry'

/**
 * 配置管理 Hook
 * 处理配置的读取、保存、实时同步
 */
export function useGameConfig(roomId) {
  const { getGameConfig, getDefaultConfig, validateConfig } = useGameRegistry()

  const config = ref({})
  const selectedGameId = ref(null)
  const isLoading = ref(false)
  const lastUpdated = ref(null)
  const updatedBy = ref(null)

  /**
   * 从Firebase加载配置
   */
  const loadConfig = async () => {
    if (!roomId) return

    try {
      isLoading.value = true
      const roomRef = dbRef(database, `rooms/${roomId}`)
      const snapshot = await get(roomRef)
      const data = snapshot.val()

      if (data) {
        // 加载游戏选择
        selectedGameId.value = data.selectedGame || 'piZheXianZhi'

        // 加载配置
        if (data.gameSettings && typeof data.gameSettings === 'object') {
          config.value = { ...data.gameSettings }
          lastUpdated.value = data.gameSettings.updatedAt
          updatedBy.value = data.gameSettings.updatedBy
        } else {
          // 没有配置时使用默认配置
          config.value = getDefaultConfig(selectedGameId.value)
          lastUpdated.value = null
          updatedBy.value = null
        }
      } else {
        // 新房间，使用默认配置
        selectedGameId.value = 'piZheXianZhi'
        config.value = getDefaultConfig(selectedGameId.value)
      }
    } catch (error) {
      console.error('加载配置失败:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 保存配置到Firebase
   * @param {string} playerId - 更新者ID
   */
  const saveConfig = async (playerId) => {
    if (!roomId || !selectedGameId.value) return

    try {
      const gameConfig = getGameConfig(selectedGameId.value)
      if (!gameConfig) {
        throw new Error('游戏配置不存在')
      }

      // 验证配置
      const validation = validateConfig(selectedGameId.value, config.value)
      if (!validation.isValid) {
        throw new Error('配置验证失败: ' + validation.errors.join(', '))
      }

      const updateData = {
        selectedGame: selectedGameId.value,
        gameSettings: {
          gameType: selectedGameId.value,
          ...config.value,
          updatedAt: Date.now(),
          updatedBy: playerId
        }
      }

      const roomRef = dbRef(database, `rooms/${roomId}`)
      await update(roomRef, updateData)

      lastUpdated.value = updateData.gameSettings.updatedAt
      updatedBy.value = playerId

      return updateData
    } catch (error) {
      console.error('保存配置失败:', error)
      throw error
    }
  }

  /**
   * 重置为默认配置
   */
  const resetConfig = () => {
    if (selectedGameId.value) {
      config.value = { ...getDefaultConfig(selectedGameId.value) }
    }
  }

  /**
   * 切换游戏时更新配置
   * @param {string} newGameId
   */
  const switchGame = (newGameId) => {
    if (newGameId === selectedGameId.value) return

    selectedGameId.value = newGameId
    config.value = { ...getDefaultConfig(newGameId) }
  }

  /**
   * 获取当前配置（用于游戏开始时）
   */
  const currentGameConfig = computed(() => {
    if (!selectedGameId.value) return null

    return {
      gameId: selectedGameId.value,
      gameConfig: getGameConfig(selectedGameId.value),
      settings: {
        ...config.value,
        gameType: selectedGameId.value
      }
    }
  })

  /**
   * 获取当前游戏的配置schema
   */
  const currentSchema = computed(() => {
    const game = getGameConfig(selectedGameId.value)
    return game ? game.configSchema : {}
  })

  return {
    config,
    selectedGameId,
    isLoading,
    lastUpdated,
    updatedBy,
    currentGameConfig,
    currentSchema,
    loadConfig,
    saveConfig,
    resetConfig,
    switchGame
  }
}
