/**
 * 技能系统配置文件
 * 定义所有可用技能的类型、名称、描述等
 */

// 技能类型常量
export const SKILL_TYPES = {
  NO_SKILL: 'noSkill',
  VIEW_FLOOR: 'viewFloor'
};

// 技能配置
export const SKILL_CONFIGS = {
  [SKILL_TYPES.NO_SKILL]: {
    name: '无技能',
    icon: '🚫',
    description: '没有特殊技能',
    maxUsage: 0,
    canUse: () => false
  },
  [SKILL_TYPES.VIEW_FLOOR]: {
    name: '查看楼层牌',
    icon: '🔮',
    description: '临时查看一张未揭示的楼层牌2秒',
    maxUsage: 1,
    // 检查技能是否可用
    canUse: (player, roomData) => {
      if (!player || !roomData) return false;
      // 检查玩家是否有此技能且未使用
      const hasSkill = player.skill?.hasSkill && player.skill?.skillType === SKILL_TYPES.VIEW_FLOOR;
      const notUsed = !player.skill?.skillUsed;
      return hasSkill && notUsed;
    }
  }
};

// 获取技能显示名称
export function getSkillName(skillType) {
  return SKILL_CONFIGS[skillType]?.name || '未知技能';
}

// 获取技能图标
export function getSkillIcon(skillType) {
  return SKILL_CONFIGS[skillType]?.icon || '❓';
}

// 获取技能描述
export function getSkillDescription(skillType) {
  return SKILL_CONFIGS[skillType]?.description || '无描述';
}

// 检查技能是否可用
export function isSkillUsable(skillType, player, roomData) {
  const config = SKILL_CONFIGS[skillType];
  return config?.canUse ? config.canUse(player, roomData) : false;
}
