import { ControlTypes } from '../controls/schema'

export default {
  // 游戏元信息
  id: 'piZheXianZhi',
  name: '屁者先知',
  icon: '🎯',
  description: '一个有趣的推理游戏，乘客需要找出并淘汰所有屁者',
  minPlayers: 3,
  maxPlayers: 8,

  // 默认配置
  defaultConfig: {
    gameType: 'piZheXianZhi',
    bigFartCount: 1,        // 大屁数量（0-4），小屁数量 = 4 - 大屁数量
    updatedAt: Date.now(),
    updatedBy: ''
  },

  // 配置项定义
  configSchema: {
    bigFartCount: {
      type: ControlTypes.SELECT,
      label: '大屁数量',
      description: '特殊屁牌数量。小屁数量将自动计算为 4 - 大屁数量',
      options: [
        { value: 0, label: '0张（全是小屁）' },
        { value: 1, label: '1张（默认）' },
        { value: 2, label: '2张' },
        { value: 3, label: '3张' },
        { value: 4, label: '4张（全是特殊屁）' }
      ],
      defaultValue: 1
    }
  },

  // 配置验证规则
  validationRules: {
    bigFartCount: (value) => value >= 0 && value <= 4
  }
}
