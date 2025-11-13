import { reactive, computed } from 'vue'
import { gameRegistry } from '../config/games'

/**
 * 游戏注册管理 Hook
 * 提供游戏的注册、查询、验证等功能
 */
export function useGameRegistry() {
  const state = reactive({
    // 已注册的游戏映射
    games: gameRegistry.games,

    // 当前选中的游戏
    selectedGameId: null
  })

  /**
   * 获取所有游戏列表（用于游戏选择器）
   */
  const gameList = computed(() => {
    return gameRegistry.getGameList()
  })

  /**
   * 根据ID获取游戏配置
   * @param {string} gameId
   * @returns {Object|null}
   */
  const getGameConfig = (gameId) => {
    return gameRegistry.getGameConfig(gameId)
  }

  /**
   * 获取游戏的默认配置
   * @param {string} gameId
   * @returns {Object}
   */
  const getDefaultConfig = (gameId) => {
    const game = getGameConfig(gameId)
    return game ? { ...game.defaultConfig } : {}
  }

  /**
   * 验证配置项
   * @param {string} gameId
   * @param {Object} config
   * @returns {{isValid: boolean, errors: string[]}}
   */
  const validateConfig = (gameId, config) => {
    const game = getGameConfig(gameId)
    if (!game) {
      return { isValid: false, errors: ['游戏不存在'] }
    }

    const errors = []
    const rules = game.validationRules || {}

    for (const [key, rule] of Object.entries(rules)) {
      if (!rule(config[key])) {
        errors.push(`${game.configSchema[key].label} 验证失败`)
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * 注册新游戏
   * @param {Object} gameConfig
   */
  const registerGame = (gameConfig) => {
    gameRegistry.registerGame(gameConfig)
  }

  /**
   * 获取游戏名称
   * @param {string} gameId
   * @returns {string}
   */
  const getGameName = (gameId) => {
    return gameRegistry.getGameName(gameId)
  }

  /**
   * 获取游戏图标
   * @param {string} gameId
   * @returns {string}
   */
  const getGameIcon = (gameId) => {
    return gameRegistry.getGameIcon(gameId)
  }

  /**
   * 检查游戏是否存在
   * @param {string} gameId
   * @returns {boolean}
   */
  const hasGame = (gameId) => {
    return gameRegistry.hasGame(gameId)
  }

  return {
    state,
    gameList,
    getGameConfig,
    getDefaultConfig,
    validateConfig,
    registerGame,
    getGameName,
    getGameIcon,
    hasGame
  }
}
