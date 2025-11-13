import { ControlTypes } from '../controls/schema'

export default {
  // 游戏元信息
  id: 'piZheXianZhi',
  name: '屁者先知',
  icon: '🎯',
  description: '一个有趣的推理游戏',
  minPlayers: 3,
  maxPlayers: 8,

  // 默认配置
  defaultConfig: {
    gameType: 'piZheXianZhi',
    turnTimeLimit: 60,        // 回合时间(秒)
    victoryScore: 150,         // 胜利得分
    enablePenalty: true,       // 启用惩罚卡
    difficulty: 'medium',      // 难度
    playerCount: 4,            // 玩家数量
    updatedAt: Date.now(),
    updatedBy: ''
  },

  // 配置项定义
  configSchema: {
    turnTimeLimit: {
      type: ControlTypes.SELECT,
      label: '回合时间限制',
      description: '每位玩家思考和出牌的时间限制',
      options: [
        { value: 30, label: '30秒' },
        { value: 60, label: '60秒' },
        { value: 90, label: '90秒' },
        { value: 120, label: '120秒' },
        { value: 0, label: '无限制' }
      ],
      defaultValue: 60
    },
    victoryScore: {
      type: ControlTypes.SELECT,
      label: '胜利得分',
      description: '达到此分数即可获得胜利',
      options: [
        { value: 100, label: '100分' },
        { value: 150, label: '150分' },
        { value: 200, label: '200分' },
        { value: 300, label: '300分' }
      ],
      defaultValue: 150
    },
    enablePenalty: {
      type: ControlTypes.SWITCH,
      label: '启用惩罚卡',
      description: '开启后玩家答错会扣除分数',
      defaultValue: true
    },
    difficulty: {
      type: ControlTypes.SELECT,
      label: '难度等级',
      description: '影响题目的难度和得分倍数',
      options: [
        { value: 'easy', label: '简单' },
        { value: 'medium', label: '中等' },
        { value: 'hard', label: '困难' }
      ],
      defaultValue: 'medium'
    },
    playerCount: {
      type: ControlTypes.SELECT,
      label: '支持玩家数量',
      description: '游戏中支持的最大玩家数',
      options: [
        { value: 3, label: '3人' },
        { value: 4, label: '4人' },
        { value: 5, label: '5人' },
        { value: 6, label: '6人' },
        { value: 7, label: '7人' },
        { value: 8, label: '8人' }
      ],
      defaultValue: 4
    }
  },

  // 配置验证规则
  validationRules: {
    turnTimeLimit: (value) => value >= 0 && value <= 300,
    victoryScore: (value) => value >= 50 && value <= 500,
    playerCount: (value) => value >= 3 && value <= 8
  }
}
