/**
 * 屁者先知 - 场景牌生成算法
 * 根据需求文档 v2.1 实现
 */

import { CARD_EFFECTS, getBigFartCardTypes } from './piZheXianZhiCardEffects'

/**
 * 生成8张场景牌
 * @param {number} bigFartCount - 大屁牌数量 (0-4)
 * @returns {Object} 8张场景牌对象，键为楼层号(1-8)
 *
 * @example
 * // 生成1张大屁牌（自动3张小屁牌）
 * const cards = generateScenarioCards(1)
 * // 返回: { 1: {...}, 2: {...}, ..., 8: {...} }
 */
export function generateScenarioCards(bigFartCount) {
  // 验证输入
  if (bigFartCount < 0 || bigFartCount > 4) {
    throw new Error(`大屁牌数量必须在0-4之间，当前值: ${bigFartCount}`)
  }

  // 计算小屁牌数量
  const smallFartCount = 4 - bigFartCount
  console.log(`生成场景牌: 大屁${bigFartCount}张, 小屁${smallFartCount}张, 无屁4张`)

  const cards = []

  // 1. 生成4张无屁牌
  for (let i = 0; i < 4; i++) {
    cards.push(createCard('无屁'))
  }

  // 2. 生成小屁牌
  for (let i = 0; i < smallFartCount; i++) {
    cards.push(createCard('有屁'))
  }

  // 3. 生成大屁牌（随机选择类型）
  const bigFartTypes = getBigFartCardTypes()
  for (let i = 0; i < bigFartCount; i++) {
    const randomType = bigFartTypes[Math.floor(Math.random() * bigFartTypes.length)]
    cards.push(createCard(randomType))
  }

  // 4. 随机打乱并分配楼层
  const shuffledCards = shuffleArray(cards)
  const scenarioCards = {}

  for (let i = 0; i < 8; i++) {
    const floor = i + 1  // 楼层号 1-8
    scenarioCards[floor] = {
      ...shuffledCards[i],
      floor: floor
    }
  }

  return scenarioCards
}

/**
 * 创建单张场景牌
 * @param {string} cardType - 卡牌类型
 * @returns {Object} 场景牌对象
 */
function createCard(cardType) {
  const cardInfo = CARD_EFFECTS[cardType]

  if (!cardInfo) {
    throw new Error(`未知的卡牌类型: ${cardType}`)
  }

  return {
    floor: 0,                      // 楼层稍后分配
    hasFart: cardInfo.hasFart,
    cardType: cardType,
    cardName: cardInfo.name,
    cardEffect: cardInfo.effect,
    revealed: false,               // 初始状态：未揭示
    revealedAt: null               // 揭示时间
  }
}

/**
 * 数组随机打乱算法（Fisher-Yates洗牌算法）
 * @param {Array} array - 要打乱的数组
 * @returns {Array} 打乱后的数组
 */
function shuffleArray(array) {
  const result = [...array]  // 创建副本避免修改原数组

  for (let i = result.length - 1; i > 0; i--) {
    // 生成0到i之间的随机索引
    const j = Math.floor(Math.random() * (i + 1))

    // 交换元素
    ;[result[i], result[j]] = [result[j], result[i]]
  }

  return result
}

/**
 * 获取下一张要揭示的楼层号
 * @param {Object} scenarioCards - 场景牌对象
 * @returns {number|null} 下一张楼层号，如果全部揭示则返回null
 *
 * @example
 * const cards = generateScenarioCards(1)
 * const nextFloor = getNextFloorToReveal(cards)
 * // 返回 1（如果1F未揭示）或更大楼层号
 */
export function getNextFloorToReveal(scenarioCards) {
  for (let floor = 1; floor <= 8; floor++) {
    const card = scenarioCards[floor]
    if (card && !card.revealed) {
      return floor
    }
  }
  return null  // 所有楼层都已揭示
}

/**
 * 揭示指定楼层的牌
 * @param {Object} scenarioCards - 场景牌对象
 * @param {number} floor - 要揭示的楼层号 (1-8)
 * @returns {Object} 更新后的场景牌对象
 *
 * @example
 * const cards = generateScenarioCards(1)
 * const updatedCards = revealCard(cards, 1)
 * // 1F的牌现在 revealed: true
 */
export function revealCard(scenarioCards, floor) {
  if (floor < 1 || floor > 8) {
    throw new Error(`无效的楼层号: ${floor}，应在1-8之间`)
  }

  const card = scenarioCards[floor]
  if (!card) {
    throw new Error(`楼层${floor}不存在`)
  }

  if (card.revealed) {
    throw new Error(`楼层${floor}的牌已经揭示过了`)
  }

  // 更新卡牌状态
  scenarioCards[floor] = {
    ...card,
    revealed: true,
    revealedAt: Date.now()
  }

  return scenarioCards
}

/**
 * 计算已揭示的有屁牌数量
 * @param {Object} scenarioCards - 场景牌对象
 * @returns {number} 已揭示的有屁牌数量
 *
 * @example
 * const cards = generateScenarioCards(1)
 * const count = getRevealedFartCardCount(cards)
 */
export function getRevealedFartCardCount(scenarioCards) {
  let count = 0

  for (let floor = 1; floor <= 8; floor++) {
    const card = scenarioCards[floor]
    if (card && card.revealed && card.hasFart) {
      count++
    }
  }

  return count
}

/**
 * 获取所有已揭示的卡牌
 * @param {Object} scenarioCards - 场景牌对象
 * @returns {Array} 已揭示的卡牌数组
 *
 * @example
 * const cards = generateScenarioCards(1)
 * revealCard(cards, 1)
 * const revealed = getRevealedCards(cards)
 * // 返回 [{ floor: 1, ... }, ...]
 */
export function getRevealedCards(scenarioCards) {
  const revealed = []

  for (let floor = 1; floor <= 8; floor++) {
    const card = scenarioCards[floor]
    if (card && card.revealed) {
      revealed.push(card)
    }
  }

  return revealed
}

/**
 * 获取指定楼层的卡牌
 * @param {Object} scenarioCards - 场景牌对象
 * @param {number} floor - 楼层号 (1-8)
 * @returns {Object|null} 卡牌对象或null
 */
export function getCardByFloor(scenarioCards, floor) {
  return scenarioCards[floor] || null
}

/**
 * 检查是否所有有屁牌都已揭示
 * @param {Object} scenarioCards - 场景牌对象
 * @param {number} totalFartCards - 总有屁牌数量（固定为4）
 * @returns {boolean} 是否全部揭示
 */
export function areAllFartCardsRevealed(scenarioCards, totalFartCards = 4) {
  const revealedCount = getRevealedFartCardCount(scenarioCards)
  return revealedCount >= totalFartCards
}

/**
 * 验证场景牌数据完整性
 * @param {Object} scenarioCards - 场景牌对象
 * @returns {Object} 验证结果 { isValid: boolean, errors: string[] }
 */
export function validateScenarioCards(scenarioCards) {
  const errors = []

  // 检查是否有8张牌
  if (!scenarioCards || typeof scenarioCards !== 'object') {
    return { isValid: false, errors: ['场景牌数据不存在'] }
  }

  const floors = Object.keys(scenarioCards).map(Number).sort((a, b) => a - b)

  if (floors.length !== 8) {
    errors.push(`场景牌数量不正确: ${floors.length}，应为8`)
  }

  // 检查楼层连续性
  for (let i = 0; i < 8; i++) {
    if (floors[i] !== i + 1) {
      errors.push(`楼层不连续: 缺少楼层${i + 1}`)
      break
    }
  }

  // 检查每张牌的数据完整性
  for (const floor of floors) {
    const card = scenarioCards[floor]
    if (!card) {
      errors.push(`楼层${floor}缺失`)
      continue
    }

    const required = ['floor', 'hasFart', 'cardType', 'cardName', 'cardEffect', 'revealed']
    for (const field of required) {
      if (card[field] === undefined || card[field] === null) {
        errors.push(`楼层${floor}缺少字段: ${field}`)
      }
    }

    // 验证卡牌类型
    if (!CARD_EFFECTS[card.cardType]) {
      errors.push(`楼层${floor}无效的卡牌类型: ${card.cardType}`)
    }

    // 验证楼层号
    if (card.floor !== floor) {
      errors.push(`楼层${floor}楼层号不匹配: ${card.floor}`)
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * 统计卡牌分布
 * @param {Object} scenarioCards - 场景牌对象
 * @returns {Object} 统计信息
 *
 * @example
 * const cards = generateScenarioCards(1)
 * const stats = getCardDistribution(cards)
 * // 返回 { 无屁: 4, 有屁: 3, 有连环屁: 1, ... }
 */
export function getCardDistribution(scenarioCards) {
  const stats = {}

  for (let floor = 1; floor <= 8; floor++) {
    const card = scenarioCards[floor]
    if (card) {
      stats[card.cardType] = (stats[card.cardType] || 0) + 1
    }
  }

  return stats
}
