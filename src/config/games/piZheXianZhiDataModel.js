/**
 * 屁者先知 - 数据模型定义
 * 根据需求文档 v2.1 设计
 */

/**
 * 房间数据模型
 * 存储位置：Firebase Realtime Database /rooms/{roomId}
 */
export const ROOM_DATA_MODEL = {
  // 基础信息
  roomId: "unique_room_id",        // 房间唯一ID
  hostId: "player_id",             // 房主玩家ID
  gameType: "piZheXianZhi",        // 游戏类型
  status: "waiting|playing|finished",  // 房间状态：等待/进行中/结束
  createdAt: 1702345678901,        // 创建时间戳

  // 游戏进度
  currentFloor: 1,                 // 当前揭示到几楼（1-8）
  fartCardsRevealedCount: 0,       // 已揭示的有屁牌数量（0-4）

  // 游戏设置（大屁牌数量，小屁=4-大屁）
  settings: {
    bigFartCount: 1,               // 大屁数量 (0-4)
    smallFartCount: 3              // 小屁数量 = 4 - bigFartCount
  },

  // 玩家信息（存储在子节点 /players）
  players: {
    // playerId: {
    //   id: "player_id",
    //   name: "玩家名称",
    //   role: "host|player",
    //   identity: "passenger|assassin",  // 乘客/屁者
    //   status: "alive|out",            // 存活/出局
    //   avatar: "😊",
    //   score: 0,
    //   joinedAt: 1702345678901
    // }
  },

  // 场景牌（8张牌，1F-8F）
  // 存储在子节点 /scenarioCards
  scenarioCards: {
    // floor: {
    //   floor: 1,                      // 楼层 1-8
    //   hasFart: false,                // 是否有屁
    //   cardType: "无屁|有屁|有连环屁|有蔫儿屁|有臭屁|有彩虹屁|有闷屁",
    //   cardName: "卡牌中文名称",
    //   cardEffect: "卡牌效果原文",
    //   revealed: false,               // 是否已揭示
    //   revealedAt: null               // 揭示时间戳
    // }
  },

  // 游戏结果（游戏结束时存储）
  gameResult: {
    winner: "passengers|assassins|null",  // 获胜阵营
    reason: "胜利原因说明",                // 胜利详细原因
    revealedAt: null,                     // 结果揭晓时间
    statistics: {
      totalPlayers: 0,                    // 总玩家数
      assassinsAlive: 0,                  // 存活屁者数量
      passengersAlive: 0,                 // 存活乘客数量
      fartCardsRevealed: 0                // 揭示的有屁牌数量
    }
  }
}

/**
 * 玩家数据模型
 * 存储位置：Firebase /rooms/{roomId}/players/{playerId}
 */
export const PLAYER_DATA_MODEL = {
  id: "browser_unique_id",         // 玩家唯一ID（基于浏览器特征生成）
  name: "玩家昵称",                 // 玩家显示名称
  role: "host|player",             // 角色：房主/普通玩家
  identity: "passenger|assassin|null",  // 身份：乘客/屁者/未选择（游戏开始前为null）
  status: "alive|out",             // 状态：存活/出局
  avatar: "😊",                    // 头像Emoji
  score: 0,                        // 得分（暂未使用，为扩展预留）
  joinedAt: 1702345678901,         // 加入时间戳
  isOnline: true                   // 在线状态
}

/**
 * 场景牌数据模型
 * 存储位置：Firebase /rooms/{roomId}/scenarioCards/{floor}
 */
export const SCENARIO_CARD_DATA_MODEL = {
  floor: 1,                        // 楼层 1-8
  hasFart: false,                  // 是否有屁
  cardType: "无屁",                // 卡牌类型
  cardName: "无屁",                // 卡牌中文名称
  cardEffect: "无效果",            // 卡牌效果原文描述
  revealed: false,                 // 是否已揭示
  revealedAt: null                 // 揭示时间戳
}

/**
 * Firebase 数据结构示例
 *
 * rooms/
 * ├── {roomId}/
 * │   ├── roomId: "abc123"
 * │   ├── hostId: "browser_123"
 * │   ├── gameType: "piZheXianZhi"
 * │   ├── status: "playing"
 * │   ├── createdAt: 1702345678901
 * │   ├── currentFloor: 3
 * │   ├── fartCardsRevealedCount: 1
 * │   ├── settings: {
 * │   │   bigFartCount: 1,
 * │   │   smallFartCount: 3
 * │   │ }
 * │   ├── players: {
 * │   │   browser_123: {
 * │   │     id: "browser_123",
 * │   │     name: "张三",
 * │   │     role: "host",
 * │   │     identity: "passenger",
 * │   │     status: "alive",
 * │   │     avatar: "😀",
 * │   │     score: 0,
 * │   │     joinedAt: 1702345678901,
 * │   │     isOnline: true
 * │   │   },
 * │   │   browser_456: { ... }
 * │   │ }
 * │   ├── scenarioCards: {
 * │   │   1: {
 * │   │     floor: 1,
 * │   │     hasFart: true,
 * │   │     cardType: "有臭屁",
 * │   │     cardName: "有臭屁",
 * │   │     cardEffect: "对所有玩家造成2点伤害",
 * │   │     revealed: true,
 * │   │     revealedAt: 1702345680000
 * │   │   },
 * │   │   2: {
 * │   │     floor: 2,
 * │   │     hasFart: false,
 * │   │     cardType: "无屁",
 * │   │     cardName: "无屁",
 * │   │     cardEffect: "无效果",
 * │   │     revealed: true,
 * │   │     revealedAt: 1702345681000
 * │   │   },
 * │   │   ... 3F-8F
 * │   │ }
 * │   └── gameResult: null  // 游戏未结束
 */

/**
 * 游戏状态流转
 *
 * waiting (等待开始)
 *   ↓ 房主点击"开始游戏"
 * playing (游戏进行中)
 *   ↓ 满足胜利条件
 * finished (游戏结束)
 */
export const GAME_STATUS = {
  WAITING: 'waiting',      // 等待玩家加入和选择身份
  PLAYING: 'playing',      // 游戏进行中
  FINISHED: 'finished'     // 游戏已结束
}

/**
 * 玩家身份
 */
export const PLAYER_IDENTITY = {
  PASSENGER: 'passenger',  // 乘客
  ASSASSIN: 'assassin'     // 屁者
}

/**
 * 玩家状态
 */
export const PLAYER_STATUS = {
  ALIVE: 'alive',          // 存活
  OUT: 'out'               // 出局
}

/**
 * 卡牌类型
 */
export const CARD_TYPES = {
  NO_FART: '无屁',         // 无屁牌
  SMALL_FART: '有屁',      // 小屁牌
  BIG_FART連環: '有连环屁',  // 大屁牌-连环屁
  BIG_FART蔫儿: '有蔫儿屁',   // 大屁牌-蔫儿屁
  BIG_FART臭: '有臭屁',      // 大屁牌-臭屁
  BIG_FART彩虹: '有彩虹屁',   // 大屁牌-彩虹屁
  BIG_FART闷: '有闷屁'       // 大屁牌-闷屁
}
