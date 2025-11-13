/**
 * 支持的控件类型枚举
 */
export const ControlTypes = {
  INPUT: 'input',           // 文本输入框
  NUMBER: 'number',         // 数字输入框
  SELECT: 'select',         // 下拉选择
  SWITCH: 'switch',         // 开关切换
  SLIDER: 'slider',         // 滑块
  CHECKBOX: 'checkbox',     // 复选框
  TEXTAREA: 'textarea',     // 多行文本
  RADIO: 'radio'            // 单选按钮组
}

/**
 * 配置项通用接口
 * @typedef {Object} ConfigField
 * @property {string} type - 控件类型 (ControlTypes中的值)
 * @property {string} label - 显示标签
 * @property {*} defaultValue - 默认值
 * @property {string} [description] - 详细描述
 * @property {boolean} [required] - 是否必填
 * @property {*} [options] - 选项数据（select/radio类型使用）
 * @property {number} [min] - 最小值（slider/number类型使用）
 * @property {number} [max] - 最大值（slider/number类型使用）
 * @property {number} [step] - 步长（slider类型使用）
 * @property {string} [unit] - 单位（显示用）
 */

/**
 * 游戏配置接口
 * @typedef {Object} GameConfig
 * @property {string} id - 游戏ID
 * @property {string} name - 游戏名称
 * @property {string} icon - 游戏图标
 * @property {string} description - 游戏描述
 * @property {Object} defaultConfig - 默认配置
 * @property {Object<string, ConfigField>} configSchema - 配置项定义
 * @property {Object<string, Function>} [validationRules] - 验证规则
 */
