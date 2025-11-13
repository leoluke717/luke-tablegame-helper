import { ControlTypes } from '../controls/schema'

export default {
  // 游戏元信息
  id: 'sanGuoSha',
  name: '三国杀',
  icon: '⚔️',
  description: '经典卡牌策略游戏，扮演三国名将，体验智谋较量',
  minPlayers: 4,
  maxPlayers: 8,

  // 默认配置
  defaultConfig: {
    gameType: 'sanGuoSha',
    playerCount: 8,
    gameMode: 'standard',       // 游戏模式
    enableItems: true,          // 启用道具
    enableRoles: true,          // 显示身份牌
    turnTimeLimit: 90,          // 出牌时间
    maxRounds: 10,              // 最大回合数
    victoryCondition: 'kill_all', // 胜利条件
    updatedAt: Date.now(),
    updatedBy: ''
  },

  // 配置项定义
  configSchema: {
    playerCount: {
      type: ControlTypes.SELECT,
      label: '玩家数量',
      description: '游戏中支持的最大玩家数',
      required: true,
      options: [
        { value: 4, label: '4人（2v2）' },
        { value: 5, label: '5人（身份局）' },
        { value: 6, label: '6人（身份局）' },
        { value: 7, label: '7人（身份局）' },
        { value: 8, label: '8人（身份局）' }
      ],
      defaultValue: 8
    },
    gameMode: {
      type: ControlTypes.SELECT,
      label: '游戏模式',
      description: '选择不同的游戏模式',
      required: true,
      options: [
        { value: 'standard', label: '标准模式' },
        { value: 'ultimate', label: '终极模式' },
        { value: 'dragon', label: '龙战模式' }
      ],
      defaultValue: 'standard'
    },
    enableItems: {
      type: ControlTypes.SWITCH,
      label: '启用道具',
      description: '开启后可使用武器、防具等道具',
      defaultValue: true
    },
    enableRoles: {
      type: ControlTypes.SWITCH,
      label: '显示身份牌',
      description: '身份牌用于确定胜利条件',
      defaultValue: true
    },
    turnTimeLimit: {
      type: ControlTypes.SLIDER,
      label: '出牌时间限制',
      description: '每位玩家出牌的时间限制',
      min: 30,
      max: 180,
      step: 30,
      unit: '秒',
      defaultValue: 90
    },
    maxRounds: {
      type: ControlTypes.NUMBER,
      label: '最大回合数',
      description: '达到最大回合数后根据积分判定胜利',
      min: 5,
      max: 20,
      defaultValue: 10
    },
    victoryCondition: {
      type: ControlTypes.SELECT,
      label: '胜利条件',
      description: '确定游戏的胜利方式',
      required: true,
      options: [
        { value: 'kill_all', label: '消灭所有敌人' },
        { value: 'eliminate_roles', label: '消灭指定身份' },
        { value: 'score_based', label: '积分判定' }
      ],
      defaultValue: 'kill_all'
    }
  },

  // 验证规则
  validationRules: {
    playerCount: (value) => value >= 4 && value <= 8,
    turnTimeLimit: (value) => value >= 30 && value <= 180,
    maxRounds: (value) => value >= 5 && value <= 20
  }
}
