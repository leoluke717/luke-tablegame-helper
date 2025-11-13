# 游戏设置架构文档

## 🎯 概述

新架构实现了**插件化的游戏注册管理系统**，支持动态添加新游戏，每个游戏都有独立的配置项和UI控件。

## 📁 项目结构

```
src/
├── config/
│   ├── games/
│   │   ├── index.js              # 游戏注册表
│   │   ├── piZheXianZhi.js       # 屁者先知配置
│   │   └── sanGuoSha.js          # 三国杀配置示例
│   └── controls/
│       └── schema.js             # 控件类型定义
├── composables/
│   ├── useGameRegistry.js        # 游戏注册管理
│   └── useGameConfig.js          # 配置管理
├── components/
│   ├── DynamicConfigRenderer.vue # 动态表单渲染器
│   └── FormControls/
│       ├── InputField.vue        # 输入框控件
│       ├── SelectField.vue       # 下拉选择控件
│       ├── SwitchField.vue       # 开关控件
│       ├── SliderField.vue       # 滑块控件
│       └── CheckboxField.vue     # 复选框控件
└── views/
    ├── GameSettingsView.vue      # 游戏设置页面（已重构）
    └── LobbyView.vue             # 大厅页面（已更新）
```

## 🚀 如何添加新游戏

### 步骤1：创建游戏配置文件

在 `src/config/games/` 目录下创建新文件，如 `myNewGame.js`：

```javascript
import { ControlTypes } from '../controls/schema'

export default {
  // 游戏元信息
  id: 'myNewGame',              // 唯一ID
  name: '我的新游戏',             // 显示名称
  icon: '🎮',                    // 游戏图标
  description: '这是一个新游戏',   // 游戏描述
  minPlayers: 3,                 // 最小玩家数
  maxPlayers: 8,                 // 最大玩家数

  // 默认配置
  defaultConfig: {
    gameType: 'myNewGame',
    // ... 其他配置项
    updatedAt: Date.now(),
    updatedBy: ''
  },

  // 配置项定义
  configSchema: {
    // 配置项名称: {
    //   type: 控件类型,
    //   label: 显示标签,
    //   description: 详细描述,
    //   required: 是否必填,
    //   options: 选项数据（select/radio类型）,
    //   min: 最小值（slider/number类型）,
    //   max: 最大值（slider/number类型）,
    //   step: 步长（slider类型）,
    //   unit: 单位,
    //   defaultValue: 默认值
    // }

    setting1: {
      type: ControlTypes.SELECT,
      label: '设置1',
      options: [
        { value: 'opt1', label: '选项1' },
        { value: 'opt2', label: '选项2' }
      ],
      defaultValue: 'opt1'
    },

    setting2: {
      type: ControlTypes.SWITCH,
      label: '启用功能',
      description: '是否启用某个功能',
      defaultValue: true
    }
  },

  // 验证规则（可选）
  validationRules: {
    setting1: (value) => !!value,
    setting2: (value) => typeof value === 'boolean'
  }
}
```

### 步骤2：在注册表中注册游戏

编辑 `src/config/games/index.js`：

```javascript
import piZheXianZhi from './piZheXianZhi'
import sanGuoSha from './sanGuoSha'
import myNewGame from './myNewGame'  // 导入新游戏

export const gameRegistry = {
  games: {
    piZheXianZhi,
    sanGuoSha,
    myNewGame  // 注册新游戏
  },
  // ... 其他方法
}
```

### 步骤3：在游戏开始时获取配置

```javascript
import { useGameConfig } from '../composables/useGameConfig'
import { gameRegistry } from '../config/games'

const { currentGameConfig } = useGameConfig(roomId)

// 获取游戏ID
const gameId = currentGameConfig.value.gameId

// 获取游戏配置
const settings = currentGameConfig.value.settings

// 获取游戏完整配置对象
const gameConfig = currentGameConfig.value.gameConfig

// 使用配置
console.log('游戏ID:', gameId)
console.log('游戏设置:', settings)
```

## 🎨 支持的控件类型

### 1. SelectField - 下拉选择
```javascript
{
  type: ControlTypes.SELECT,
  label: '选择难度',
  options: [
    { value: 'easy', label: '简单' },
    { value: 'hard', label: '困难' }
  ],
  defaultValue: 'easy'
}
```

### 2. SwitchField - 开关切换
```javascript
{
  type: ControlTypes.SWITCH,
  label: '启用XX功能',
  description: '开启后可以...',
  defaultValue: true
}
```

### 3. SliderField - 滑块
```javascript
{
  type: ControlTypes.SLIDER,
  label: '时间限制',
  min: 30,
  max: 180,
  step: 30,
  unit: '秒',
  defaultValue: 90
}
```

### 4. InputField - 输入框
```javascript
{
  type: ControlTypes.INPUT,
  label: '房间名称',
  placeholder: '请输入房间名称',
  defaultValue: ''
}
```

### 5. NumberField - 数字输入
```javascript
{
  type: ControlTypes.NUMBER,
  label: '最大回合数',
  min: 5,
  max: 20,
  defaultValue: 10
}
```

### 6. CheckboxField - 复选框
```javascript
{
  type: ControlTypes.CHECKBOX,
  label: '选择扩展包',
  options: [
    { value: 'exp1', label: '扩展包1' },
    { value: 'exp2', label: '扩展包2' }
  ],
  defaultValue: []
}
```

## 🔧 API 参考

### useGameRegistry

```javascript
import { useGameRegistry } from '../composables/useGameRegistry'

const {
  gameList,           // 游戏列表
  getGameConfig,      // 获取游戏配置
  getDefaultConfig,   // 获取默认配置
  validateConfig,     // 验证配置
  registerGame,       // 注册游戏
  getGameName,        // 获取游戏名称
  getGameIcon,        // 获取游戏图标
  hasGame             // 检查游戏是否存在
} = useGameRegistry()
```

### useGameConfig

```javascript
import { useGameConfig } from '../composables/useGameConfig'

const {
  config,              // 当前配置
  selectedGameId,      // 当前游戏ID
  isLoading,           // 是否加载中
  loadConfig,          // 加载配置
  saveConfig,          // 保存配置
  resetConfig,         // 重置配置
  switchGame,          // 切换游戏
  currentGameConfig    // 当前游戏完整配置
} = useGameConfig(roomId)
```

### gameRegistry

```javascript
import { gameRegistry } from '../config/games'

// 获取游戏列表
const games = gameRegistry.getGameList()

// 根据ID获取游戏
const game = gameRegistry.getGameConfig('piZheXianZhi')

// 获取游戏名称
const name = gameRegistry.getGameName('piZheXianZhi')

// 获取游戏图标
const icon = gameRegistry.getGameIcon('piZheXianZhi')

// 注册新游戏
gameRegistry.registerGame(newGameConfig)
```

## 📝 数据存储结构

在 Firebase Realtime Database 中的存储结构：

```
rooms/
├── {roomId}/
│   ├── selectedGame: "piZheXianZhi"     # 当前选择的游戏ID
│   ├── gameSettings: {                  # 游戏配置
│   │   ├── gameType: "piZheXianZhi"
│   │   ├── turnTimeLimit: 60
│   │   ├── victoryScore: 150
│   │   ├── enablePenalty: true
│   │   ├── difficulty: "medium"
│   │   ├── playerCount: 4
│   │   ├── updatedAt: 1702345678901
│   │   └── updatedBy: "playerId"
│   │ }
│   └── players: { ... }
```

## ✨ 特性

### ✅ 已实现功能

- [x] 游戏注册表管理
- [x] 动态表单渲染器
- [x] 多种表单控件（Select, Switch, Slider, Input, Checkbox）
- [x] 配置验证规则
- [x] Firebase 实时同步
- [x] 游戏选择器
- [x] 配置重置功能
- [x] 类型安全的 JSDoc 注释
- [x] 屁者先知配置迁移
- [x] 三国杀配置示例

### 🚧 未来扩展

- [ ] 添加更多控件类型（Radio, TextArea）
- [ ] 配置预设模板功能
- [ ] 配置导入/导出功能
- [ ] 更强大的验证规则系统
- [ ] 游戏配置热重载
- [ ] 配置历史记录
- [ ] 批量配置操作

## 🎓 最佳实践

1. **配置项命名**：使用 camelCase 命名法
2. **验证规则**：为所有配置项添加验证规则
3. **默认值**：确保所有配置项都有合理的默认值
4. **文档**：在配置文件中添加清晰的注释
5. **类型安全**：使用 JSDoc 提供类型提示
6. **测试**：为新游戏配置编写测试用例

## 🐛 常见问题

### Q: 如何修改控件样式？
A: 编辑 `src/components/FormControls/` 目录下的对应组件文件。

### Q: 如何添加自定义控件类型？
A: 在 `src/config/controls/schema.js` 中添加新的类型，然后在 `DynamicConfigRenderer.vue` 中注册组件。

### Q: 如何处理复杂的配置逻辑？
A: 可以在游戏配置文件中添加自定义方法，或在 `useGameConfig` 中扩展逻辑。

## 📚 参考资源

- [Vue 3 Composition API](https://vuejs.org/guide/extras/composition-api-faq.html)
- [Firebase Realtime Database](https://firebase.google.com/docs/database)
- [Vite 构建工具](https://vitejs.dev/)

---

## 🎉 结语

这个新架构让添加新游戏变得简单高效！只需要：

1. 创建配置文件
2. 注册游戏
3. 完成！

**无需修改任何核心代码**！这就是插件化架构的魅力！ 🚀
