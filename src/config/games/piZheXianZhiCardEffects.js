/**
 * 屁者先知 - 卡牌效果配置
 * 根据需求文档 v2.1 定义所有卡牌效果
 */

/**
 * 卡牌效果配置对象
 * 所有卡牌的效果描述原文（用于展示，不计算伤害）
 */
export const CARD_EFFECTS = {
  /**
   * 无屁牌（4张）
   * 效果：无效果
   */
  "无屁": {
    hasFart: false,                // 是否有屁
    isBigFart: false,              // 是否为大屁牌（可点击查看效果）
    name: "无屁",                  // 卡牌显示名称
    effect: "无效果",              // 卡牌效果原文描述
    description: "这张牌没有任何效果", // 详细描述
    color: "#95a5a6"               // 卡牌颜色（用于UI显示）
  },

  /**
   * 小屁牌（"有屁"）
   * 效果：对所有玩家造成1点伤害
   */
  "有屁": {
    hasFart: true,
    isBigFart: false,
    name: "有屁",
    effect: "对所有玩家造成1点伤害",
    description: "最基础的屁牌，对所有玩家造成少量伤害",
    color: "#f39c12"
  },

  /**
   * 大屁牌 - 有连环屁
   * 效果：对所有玩家造成1点伤害，若上1张牌为小屁牌，则本次伤害+1，
   *       若下1张牌为小屁牌，则该小屁牌伤害+1（相邻牌需为小屁牌）
   */
  "有连环屁": {
    hasFart: true,
    isBigFart: true,               // 大屁牌，可点击查看效果
    name: "有连环屁",
    effect: "对所有玩家造成1点伤害，若上1张牌为小屁牌，则本次伤害+1，若下1张牌为小屁牌，则该小屁牌伤害+1（相邻牌需为小屁牌）",
    description: "具有连锁反应的屁牌，相邻的小屁牌会增强伤害",
    color: "#e74c3c"
  },

  /**
   * 大屁牌 - 有蔫儿屁
   * 效果：对所有玩家造成1点伤害，并使下1张无屁牌视为"对所有玩家造成1点伤害"的小屁牌。
   *       若4张无屁牌均已翻开，则本次伤害不可防御
   */
  "有蔫儿屁": {
    hasFart: true,
    isBigFart: true,
    name: "有蔫儿屁",
    effect: "对所有玩家造成1点伤害，并使下1张无屁牌视为\"对所有玩家造成1点伤害\"的小屁牌。若4张无屁牌均已翻开，则本次伤害不可防御",
    description: "可以将无屁牌转化为小屁牌，具有隐藏威胁",
    color: "#9b59b6"
  },

  /**
   * 大屁牌 - 有臭屁
   * 效果：对所有玩家造成2点伤害
   */
  "有臭屁": {
    hasFart: true,
    isBigFart: true,
    name: "有臭屁",
    effect: "对所有玩家造成2点伤害",
    description: "威力强劲的屁牌，造成双倍伤害",
    color: "#c0392b"
  },

  /**
   * 大屁牌 - 有彩虹屁
   * 效果：对所有押牌玩家造成1点不可防御的伤害。对所有空押玩家造成2点伤害
   * 注：此效果在当前版本中简化为对所有玩家造成伤害
   */
  "有彩虹屁": {
    hasFart: true,
    isBigFart: true,
    name: "有彩虹屁",
    effect: "对所有押牌玩家造成1点不可防御的伤害。对所有空押玩家造成2点伤害",
    description: "具有特殊效果的屁牌，在简化版本中造成全体伤害",
    color: "#3498db"
  },

  /**
   * 大屁牌 - 有闷屁
   * 效果：对所有玩家造成1点伤害，对所有空押玩家造成3点伤害
   * 注：此效果在当前版本中简化为对所有玩家造成伤害
   */
  "有闷屁": {
    hasFart: true,
    isBigFart: true,
    name: "有闷屁",
    effect: "对所有玩家造成1点伤害，对所有空押玩家造成3点伤害",
    description: "具有额外效果的屁牌，在简化版本中造成全体伤害",
    color: "#34495e"
  }
}

/**
 * 获取所有卡牌类型列表
 */
export const getAllCardTypes = () => {
  return Object.keys(CARD_EFFECTS)
}

/**
 * 获取所有大屁牌类型列表（用于随机选择）
 */
export const getBigFartCardTypes = () => {
  return Object.keys(CARD_EFFECTS).filter(type =>
    CARD_EFFECTS[type].hasFart && CARD_EFFECTS[type].isBigFart
  )
}

/**
 * 根据卡牌类型获取卡牌信息
 * @param {string} cardType - 卡牌类型
 * @returns {Object|null} 卡牌信息对象
 */
export const getCardInfo = (cardType) => {
  return CARD_EFFECTS[cardType] || null
}

/**
 * 检查是否为有效卡牌类型
 * @param {string} cardType - 卡牌类型
 * @returns {boolean} 是否有效
 */
export const isValidCardType = (cardType) => {
  return cardType in CARD_EFFECTS
}

/**
 * 卡牌分类统计
 */
export const CARD_CATEGORIES = {
  NO_FART: {
    types: ["无屁"],
    count: 4,  // 总共有4张无屁牌
    color: "#95a5a6"
  },
  SMALL_FART: {
    types: ["有屁"],
    count: "dynamic",  // 数量由配置决定 (0-4)
    color: "#f39c12"
  },
  BIG_FART: {
    types: ["有连环屁", "有蔫儿屁", "有臭屁", "有彩虹屁", "有闷屁"],
    count: "dynamic",  // 数量由配置决定 (0-4)
    color: "#e74c3c"
  }
}

/**
 * 卡牌展示信息生成器
 * 根据玩家权限返回不同的展示信息
 * @param {Object} card - 场景牌对象
 * @param {boolean} isOwnerOrAssassin - 是否为房主或屁者
 * @param {boolean} isAssassinViewing - 是否为屁者临时查看模式
 * @returns {Object} 展示信息
 */
export const getCardDisplayInfo = (card, isOwnerOrAssassin, isAssassinViewing = false) => {
  // 未揭示且无权限：显示隐藏状态
  if (!card.revealed && !isOwnerOrAssassin && !isAssassinViewing) {
    return {
      visible: false,
      content: "████",
      style: "hidden"
    }
  }

  // 已揭示：显示牌面内容
  if (card.revealed) {
    const cardInfo = CARD_EFFECTS[card.cardType]
    return {
      visible: true,
      content: card.cardName,  // e.g. "无屁", "有连环屁"
      style: cardInfo?.hasFart ? (cardInfo.isBigFart ? "big-fart" : "small-fart") : "no-fart",
      cardInfo: {
        name: card.cardName,
        effect: card.cardEffect,
        color: cardInfo?.color
      },
      isClickable: cardInfo?.isBigFart || false  // 大屁牌可点击查看效果
    }
  }

  // 未揭示但有权限（房主或屁者查看模式）：显示"隐藏"但不公开内容
  if ((isOwnerOrAssassin || isAssassinViewing) && !card.revealed) {
    return {
      visible: false,
      isPrivate: true,
      content: "隐藏",
      style: "private"
    }
  }

  return {
    visible: false,
    content: "未知",
    style: "error"
  }
}

/**
 * 验证卡牌数据完整性
 * @param {Object} card - 场景牌对象
 * @returns {boolean} 是否有效
 */
export const validateCard = (card) => {
  const required = ['floor', 'hasFart', 'cardType', 'cardName', 'cardEffect', 'revealed']

  // 检查必需字段
  for (const field of required) {
    if (card[field] === undefined || card[field] === null) {
      console.error(`卡牌缺少必需字段: ${field}`)
      return false
    }
  }

  // 验证卡牌类型
  if (!isValidCardType(card.cardType)) {
    console.error(`无效的卡牌类型: ${card.cardType}`)
    return false
  }

  // 验证楼层范围
  if (card.floor < 1 || card.floor > 8) {
    console.error(`无效的楼层: ${card.floor}`)
    return false
  }

  return true
}
