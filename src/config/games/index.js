import piZheXianZhi from './piZheXianZhi'
import sanGuoSha from './sanGuoSha'

/**
 * 游戏注册表 - 所有游戏配置的中央管理器
 */
export const gameRegistry = {
  // 注册游戏
  games: {
    piZheXianZhi,
    sanGuoSha
  },

  // 获取所有游戏列表（用于选择器）
  getGameList() {
    return Object.values(this.games).map(game => ({
      id: game.id,
      name: game.name,
      icon: game.icon,
      description: game.description,
      minPlayers: game.minPlayers,
      maxPlayers: game.maxPlayers
    }))
  },

  // 根据ID获取游戏配置
  getGameConfig(gameId) {
    return this.games[gameId] || null
  },

  // 注册新游戏
  registerGame(config) {
    this.games[config.id] = config
  },

  // 检查游戏是否存在
  hasGame(gameId) {
    return !!this.games[gameId]
  },

  // 获取游戏名称
  getGameName(gameId) {
    const game = this.getGameConfig(gameId)
    return game ? game.name : '未知游戏'
  },

  // 获取游戏图标
  getGameIcon(gameId) {
    const game = this.getGameConfig(gameId)
    return game ? game.icon : '❓'
  }
}

export default gameRegistry
