<template>
  <div id="identity-test">
    <div class="container">
      <h1>🔍 身份选择数据逻辑测试</h1>

      <!-- 测试场景牌生成 -->
      <section class="test-section">
        <h2>📦 测试1: 场景牌生成</h2>
        <div class="form-group">
          <label>大屁牌数量:</label>
          <select v-model="bigFartCount" @change="generateCards">
            <option v-for="i in 5" :key="i" :value="i-1">{{ i-1 }}张</option>
          </select>
          <span class="hint">→ 小屁牌数量: {{ 4 - bigFartCount }}张</span>
        </div>
        <button class="btn" @click="generateCards">🎲 生成场景牌</button>
        <div v-if="cardStats" class="result">
          <h3>生成结果:</h3>
          <pre>{{ cardStats }}</pre>
        </div>
      </section>

      <!-- 测试身份选择 -->
      <section class="test-section">
        <h2>👥 测试2: 身份选择</h2>

        <div class="players-list">
          <div v-for="(player, index) in testPlayers" :key="player.id" class="player-card">
            <div class="player-info">
              <strong>{{ player.name }}</strong>
              <span class="player-id">({{ player.id }})</span>
            </div>

            <div class="identity-selection">
              <label>
                <input
                  type="radio"
                  :name="'identity-' + player.id"
                  value="passenger"
                  v-model="player.identity"
                  @change="updatePlayerIdentity(index, 'passenger')"
                >
                🚗 乘客
              </label>

              <label>
                <input
                  type="radio"
                  :name="'identity-' + player.id"
                  value="assassin"
                  v-model="player.identity"
                  @change="updatePlayerIdentity(index, 'assassin')"
                >
                💀 屁者
              </label>

              <button
                class="btn-clear"
                @click="clearIdentity(index)"
                v-if="player.identity"
              >
                清除
              </button>
            </div>
          </div>
        </div>

        <!-- 添加测试玩家 -->
        <div class="add-player">
          <input
            v-model="newPlayerName"
            placeholder="新玩家名称"
            class="input"
            @keyup.enter="addTestPlayer"
          >
          <button class="btn" @click="addTestPlayer">➕ 添加玩家</button>
        </div>

        <!-- 身份统计 -->
        <div v-if="identityStats" class="stats">
          <h3>身份统计:</h3>
          <ul>
            <li>👥 乘客: {{ identityStats.passengers }}人</li>
            <li>💀 屁者: {{ identityStats.assassins }}人</li>
            <li>❓ 未选择: {{ identityStats.unselected }}人</li>
            <li>📊 总计: {{ identityStats.total }}人</li>
          </ul>
        </div>

        <!-- 验证结果 -->
        <div v-if="validationResult" class="validation">
          <h3>验证结果:</h3>
          <div :class="validationResult.isValid ? 'success' : 'error'">
            {{ validationResult.isValid ? '✅ 验证通过' : '❌ 验证失败' }}
          </div>
          <ul v-if="validationResult.errors.length > 0">
            <li v-for="error in validationResult.errors" :key="error" class="error">
              {{ error }}
            </li>
          </ul>
        </div>

        <!-- 胜负判定测试 -->
        <div class="win-condition-test">
          <h3>胜负判定测试:</h3>
          <button class="btn-secondary" @click="testWinCondition('immediate')">
            🔍 测试立即判定（阵营全灭）
          </button>
          <button class="btn-secondary" @click="testWinCondition('final')">
            🎯 测试终局判定（人数对比）
          </button>
          <div v-if="winTestResult" class="result">
            <h4>判定结果:</h4>
            <pre>{{ winTestResult }}</pre>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { generateScenarioCards, getCardDistribution, validateScenarioCards } from '../config/games/piZheXianZhiCardGenerator'
import {
  selectIdentity,
  getIdentityStats,
  validateIdentitySelection,
  checkImmediateWinCondition,
  checkFinalWinCondition,
  getAlivePassengerCount,
  getAliveAssassinCount,
  getIdentityDisplayName
} from '../config/games/piZheXianZhiIdentityLogic'
import { PLAYER_IDENTITY } from '../config/games/piZheXianZhiDataModel'

export default {
  name: 'IdentitySelectionTestView',
  setup() {
    // 场景牌生成测试
    const bigFartCount = ref(1)
    const cardStats = ref(null)

    const generateCards = () => {
      try {
        const cards = generateScenarioCards(bigFartCount.value)
        const distribution = getCardDistribution(cards)
        const validation = validateScenarioCards(cards)

        cardStats.value = {
          大屁牌设置: bigFartCount.value,
          小屁牌自动计算: 4 - bigFartCount.value,
          卡牌分布: distribution,
          验证结果: validation
        }

        console.log('✅ 场景牌生成成功:', cardStats.value)
      } catch (error) {
        console.error('❌ 场景牌生成失败:', error)
        cardStats.value = {
          error: error.message
        }
      }
    }

    // 身份选择测试
    const testPlayers = ref([
      { id: 'player1', name: '张三', identity: null, status: 'alive' },
      { id: 'player2', name: '李四', identity: null, status: 'alive' },
      { id: 'player3', name: '王五', identity: null, status: 'alive' },
      { id: 'player4', name: '赵六', identity: null, status: 'alive' }
    ])

    const newPlayerName = ref('')
    const winTestResult = ref(null)

    const addTestPlayer = () => {
      if (!newPlayerName.value.trim()) {
        alert('请输入玩家名称')
        return
      }

      const newPlayer = {
        id: 'player' + (testPlayers.value.length + 1),
        name: newPlayerName.value.trim(),
        identity: null,
        status: 'alive'
      }

      testPlayers.value.push(newPlayer)
      newPlayerName.value = ''
    }

    const updatePlayerIdentity = (index, identity) => {
      try {
        testPlayers.value[index] = selectIdentity(testPlayers.value[index], identity)
        console.log('✅ 身份选择成功:', testPlayers.value[index])
      } catch (error) {
        console.error('❌ 身份选择失败:', error)
        alert('身份选择失败: ' + error.message)
      }
    }

    const clearIdentity = (index) => {
      testPlayers.value[index].identity = null
      testPlayers.value[index].identitySelectedAt = null
    }

    const identityStats = computed(() => {
      return getIdentityStats(testPlayers.value)
    })

    const validationResult = computed(() => {
      return validateIdentitySelection(testPlayers.value)
    })

    const testWinCondition = (type) => {
      winTestResult.value = null

      try {
        let result = null

        if (type === 'immediate') {
          // 测试立即判定
          result = checkImmediateWinCondition(testPlayers.value)
          if (!result) {
            result = { message: '未满足立即判定条件（阵营未全灭）' }
          }
        } else if (type === 'final') {
          // 测试终局判定（假设4张有屁牌都已揭示）
          result = checkFinalWinCondition(testPlayers.value, 4)
          if (!result) {
            result = { message: '未满足终局判定条件（有屁牌未完全揭示）' }
          }
        }

        winTestResult.value = result
        console.log('✅ 胜负判定测试结果:', result)
      } catch (error) {
        console.error('❌ 胜负判定测试失败:', error)
        winTestResult.value = {
          error: error.message
        }
      }
    }

    // 初始化时生成一次场景牌
    generateCards()

    return {
      bigFartCount,
      cardStats,
      testPlayers,
      newPlayerName,
      identityStats,
      validationResult,
      winTestResult,
      generateCards,
      addTestPlayer,
      updatePlayerIdentity,
      clearIdentity,
      testWinCondition,
      PLAYER_IDENTITY
    }
  }
}
</script>

<style scoped>
#identity-test {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.container {
  max-width: 900px;
  margin: 0 auto;
  background: white;
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

h1 {
  color: #333;
  margin-bottom: 30px;
  text-align: center;
}

h2 {
  color: #555;
  margin-bottom: 15px;
  border-bottom: 2px solid #eee;
  padding-bottom: 10px;
}

h3 {
  color: #666;
  margin: 15px 0 10px;
}

.test-section {
  margin-bottom: 40px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
}

.form-group {
  margin: 15px 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.form-group label {
  font-weight: bold;
  color: #555;
}

.form-group select {
  padding: 8px 12px;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 1em;
}

.hint {
  color: #999;
  font-size: 0.9em;
}

.players-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 15px;
  margin: 20px 0;
}

.player-card {
  background: white;
  padding: 15px;
  border-radius: 10px;
  border: 2px solid #e0e0e0;
}

.player-info {
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.player-info strong {
  color: #333;
  font-size: 1.1em;
}

.player-id {
  color: #999;
  font-size: 0.9em;
  margin-left: 8px;
}

.identity-selection {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.identity-selection label {
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  padding: 5px 10px;
  border-radius: 6px;
  transition: background 0.2s;
}

.identity-selection label:hover {
  background: #f0f0f0;
}

.identity-selection input[type="radio"] {
  cursor: pointer;
}

.btn-clear {
  padding: 5px 10px;
  background: #ff6b6b;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85em;
}

.btn-clear:hover {
  background: #ff5252;
}

.add-player {
  display: flex;
  gap: 10px;
  margin: 20px 0;
}

.input {
  flex: 1;
  padding: 10px 15px;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 1em;
}

.btn {
  padding: 10px 20px;
  background: #42b983;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1em;
  font-weight: bold;
  transition: background 0.2s;
}

.btn:hover {
  background: #359268;
}

.btn-secondary {
  padding: 8px 16px;
  background: #f0f0f0;
  color: #333;
  border: 2px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9em;
  margin-right: 10px;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #e0e0e0;
  border-color: #ccc;
}

.stats, .validation, .win-condition-test {
  margin: 20px 0;
  padding: 15px;
  background: white;
  border-radius: 8px;
  border-left: 4px solid #42b983;
}

.stats ul {
  list-style: none;
  padding: 0;
}

.stats li {
  padding: 5px 0;
  color: #555;
}

.validation .success {
  color: #27ae60;
  font-weight: bold;
  margin: 10px 0;
}

.validation .error {
  color: #e74c3c;
  font-weight: bold;
  margin: 10px 0;
}

.validation .error {
  background: #fee;
  padding: 10px;
  border-radius: 6px;
  margin-top: 10px;
}

.result {
  margin: 15px 0;
  padding: 15px;
  background: white;
  border-radius: 8px;
  border: 2px solid #e0e0e0;
}

.result pre {
  background: #f5f5f5;
  padding: 10px;
  border-radius: 6px;
  overflow-x: auto;
  font-size: 0.9em;
}

.win-condition-test h3 {
  margin-bottom: 15px;
}

.win-condition-test button {
  margin: 5px 5px 5px 0;
}
</style>
