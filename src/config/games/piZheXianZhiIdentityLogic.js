/**
 * 屁者先知 - 身份选择数据逻辑
 * 根据需求文档 v2.1 实现
 */

import { PLAYER_IDENTITY } from './piZheXianZhiDataModel'

/**
 * 选择玩家身份
 * @param {Object} player - 玩家对象
 * @param {string} identity - 身份: 'passenger' 或 'assassin'
 * @returns {Object} 更新后的玩家对象
 *
 * @example
 * const player = { id: '123', name: '张三', identity: null }
 * const updatedPlayer = selectIdentity(player, 'passenger')
 */
export function selectIdentity(player, identity) {
  // 验证身份有效性
  if (!isValidIdentity(identity)) {
    throw new Error(`无效的身份: ${identity}，应为 'passenger' 或 'assassin'`)
  }

  return {
    ...player,
    identity: identity,
    identitySelectedAt: Date.now()  // 记录选择时间
  }
}

/**
 * 验证身份是否有效
 * @param {string} identity - 身份
 * @returns {boolean} 是否有效
 */
export function isValidIdentity(identity) {
  return identity === PLAYER_IDENTITY.PASSENGER || identity === PLAYER_IDENTITY.ASSASSIN
}

/**
 * 检查所有玩家是否都已选择身份
 * @param {Array} players - 玩家数组
 * @returns {boolean} 是否所有玩家都已选择
 *
 * @example
 * const players = [
 *   { id: '1', name: '张三', identity: 'passenger' },
 *   { id: '2', name: '李四', identity: 'assassin' }
 * ]
 * const allSelected = areAllIdentitiesSelected(players)
 */
export function areAllIdentitiesSelected(players) {
  if (!players || players.length === 0) {
    return false
  }

  return players.every(player => {
    return player.identity === PLAYER_IDENTITY.PASSENGER ||
           player.identity === PLAYER_IDENTITY.ASSASSIN
  })
}

/**
 * 获取身份选择统计
 * @param {Array} players - 玩家数组
 * @returns {Object} 统计信息
 *
 * @example
 * const players = [
 *   { identity: 'passenger' },
 *   { identity: 'assassin' },
 *   { identity: null }
 * ]
 * const stats = getIdentityStats(players)
 * // 返回: { passengers: 1, assassins: 1, unselected: 1, total: 3 }
 */
export function getIdentityStats(players) {
  const stats = {
    passengers: 0,      // 乘客数量
    assassins: 0,       // 屁者数量
    unselected: 0,      // 未选择数量
    total: players ? players.length : 0
  }

  if (!players) {
    return stats
  }

  for (const player of players) {
    if (player.identity === PLAYER_IDENTITY.PASSENGER) {
      stats.passengers++
    } else if (player.identity === PLAYER_IDENTITY.ASSASSIN) {
      stats.assassins++
    } else {
      stats.unselected++
    }
  }

  return stats
}

/**
 * 检查身份选择是否满足游戏要求
 * 游戏要求：至少1个乘客和1个屁者
 * @param {Array} players - 玩家数组
 * @returns {Object} 检查结果 { isValid: boolean, errors: string[] }
 */
export function validateIdentitySelection(players) {
  const errors = []
  const stats = getIdentityStats(players)

  // 检查玩家数量
  if (stats.total < 3) {
    errors.push(`玩家数量不足: ${stats.total}，至少需要3人`)
  }

  // 检查是否有乘客
  if (stats.passengers === 0) {
    errors.push('至少需要1个乘客')
  }

  // 检查是否有屁者
  if (stats.assassins === 0) {
    errors.push('至少需要1个屁者')
  }

  // 检查是否所有玩家都已选择
  if (stats.unselected > 0) {
    errors.push(`${stats.unselected}个玩家尚未选择身份`)
  }

  return {
    isValid: errors.length === 0,
    errors,
    stats
  }
}

/**
 * 获取存活的玩家（排除出局的玩家）
 * @param {Array} players - 玩家数组
 * @returns {Array} 存活玩家数组
 */
export function getAlivePlayers(players) {
  if (!players) {
    return []
  }

  return players.filter(player => player.status === 'alive')
}

/**
 * 获取存活的乘客数量
 * @param {Array} players - 玩家数组
 * @returns {number} 存活乘客数量
 */
export function getAlivePassengerCount(players) {
  const alivePlayers = getAlivePlayers(players)
  return alivePlayers.filter(player => player.identity === PLAYER_IDENTITY.PASSENGER).length
}

/**
 * 获取存活的屁者数量
 * @param {Array} players - 玩家数组
 * @returns {number} 存活屁者数量
 */
export function getAliveAssassinCount(players) {
  const alivePlayers = getAlivePlayers(players)
  return alivePlayers.filter(player => player.identity === PLAYER_IDENTITY.ASSASSIN).length
}

/**
 * 检查特定阵营是否全部出局
 * @param {Array} players - 玩家数组
 * @param {string} identity - 要检查的阵营: 'passenger' 或 'assassin'
 * @returns {boolean} 该阵营是否全部出局
 */
export function isTeamEliminated(players, identity) {
  const aliveCount = identity === PLAYER_IDENTITY.PASSENGER
    ? getAlivePassengerCount(players)
    : getAliveAssassinCount(players)

  return aliveCount === 0
}

/**
 * 检查是否满足立即胜负判定条件（阵营全灭）
 * 判定规则：
 * - 所有屁者出局 → 乘客胜利
 * - 所有乘客出局 → 屁者胜利
 * @param {Array} players - 玩家数组
 * @returns {Object|null} 判定结果，null表示未分出胜负
 *
 * @example
 * const result = checkImmediateWinCondition(players)
 * if (result) {
 *   console.log(`游戏结束，${result.winner}获胜`)
 * }
 */
export function checkImmediateWinCondition(players) {
  const allPassengers = players.filter(p => p.identity === PLAYER_IDENTITY.PASSENGER)
  const allAssassins = players.filter(p => p.identity === PLAYER_IDENTITY.ASSASSIN)

  // 只有当至少有一个阵营存在时，才检查阵营全灭
  const passengersExist = allPassengers.length > 0
  const assassinsExist = allAssassins.length > 0

  if (!passengersExist || !assassinsExist) {
    return null
  }

  const passengersAlive = getAlivePassengerCount(players)
  const assassinsAlive = getAliveAssassinCount(players)

  // 检查是否所有屁者出局
  if (assassinsAlive === 0 && assassinsExist) {
    return {
      winner: PLAYER_IDENTITY.PASSENGER,
      reason: '所有屁者都已出局',
      condition: 'team_elimination',
      revealedAt: Date.now()
    }
  }

  // 检查是否所有乘客出局
  if (passengersAlive === 0 && passengersExist) {
    return {
      winner: PLAYER_IDENTITY.ASSASSIN,
      reason: '所有乘客都已出局',
      condition: 'team_elimination',
      revealedAt: Date.now()
    }
  }

  return null
}

/**
 * 检查是否满足终局胜负判定条件（按人数对比）
 * 触发条件：所有4张有屁牌都已揭示
 * @param {Array} players - 玩家数组
 * @param {number} fartCardsRevealedCount - 已揭示的有屁牌数量
 * @returns {Object|null} 判定结果，null表示未分出胜负
 */
export function checkFinalWinCondition(players, fartCardsRevealedCount) {
  // 只有当4张有屁牌都已揭示时，才能进行终局判定
  if (fartCardsRevealedCount < 4) {
    return null
  }

  const passengersAlive = getAlivePassengerCount(players)
  const assassinsAlive = getAliveAssassinCount(players)

  // 终局判定：存活屁者数量 >= 存活乘客数量 → 屁者胜利
  if (assassinsAlive >= passengersAlive) {
    return {
      winner: PLAYER_IDENTITY.ASSASSIN,
      reason: `终局结算：屁者（${assassinsAlive}人）≥ 乘客（${passengersAlive}人）`,
      condition: 'final_count',
      revealedAt: Date.now(),
      statistics: {
        passengersAlive,
        assassinsAlive
      }
    }
  } else {
    return {
      winner: PLAYER_IDENTITY.PASSENGER,
      reason: `终局结算：屁者（${assassinsAlive}人）< 乘客（${passengersAlive}人）`,
      condition: 'final_count',
      revealedAt: Date.now(),
      statistics: {
        passengersAlive,
        assassinsAlive
      }
    }
  }
}

/**
 * 综合胜负判定
 * 优先级：
 * 1. 立即判定（阵营全灭）- 最高优先级
 * 2. 终局判定（4张有屁牌揭示后按人数对比）
 * @param {Array} players - 玩家数组
 * @param {number} fartCardsRevealedCount - 已揭示的有屁牌数量
 * @returns {Object|null} 判定结果
 */
export function checkGameEnd(players, fartCardsRevealedCount) {
  // 优先检查阵营全灭
  const immediateResult = checkImmediateWinCondition(players)
  if (immediateResult) {
    return immediateResult
  }

  // 检查终局结算
  const finalResult = checkFinalWinCondition(players, fartCardsRevealedCount)
  if (finalResult) {
    return finalResult
  }

  return null
}

/**
 * 获取身份显示名称
 * @param {string} identity - 身份
 * @returns {string} 显示名称
 */
export function getIdentityDisplayName(identity) {
  const displayNames = {
    [PLAYER_IDENTITY.PASSENGER]: '乘客',
    [PLAYER_IDENTITY.ASSASSIN]: '屁者'
  }

  return displayNames[identity] || '未知'
}

/**
 * 获取身份颜色（用于UI显示）
 * @param {string} identity - 身份
 * @returns {string} 颜色代码
 */
export function getIdentityColor(identity) {
  const colors = {
    [PLAYER_IDENTITY.PASSENGER]: '#3498db',  // 蓝色
    [PLAYER_IDENTITY.ASSASSIN]: '#e74c3c'   // 红色
  }

  return colors[identity] || '#95a5a6'  // 灰色（未选择）
}
