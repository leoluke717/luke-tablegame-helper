<template>
  <div id="scenario-cards-test">
    <div class="container">
      <h1>🃏 场景牌显示测试</h1>

      <!-- 控制面板 -->
      <section class="control-panel">
        <h2>🎮 游戏控制</h2>

        <div class="controls">
          <!-- 身份选择 -->
          <div class="control-group">
            <label>你的身份:</label>
            <select v-model="userRole" @change="updateDisplayMode">
              <option value="host">🏠 房主</option>
              <option value="player">👤 普通玩家</option>
              <option value="assassin">💀 屁者</option>
            </select>
            <span class="hint" v-if="userRole === 'assassin'">
              💡 屁者可以查看所有牌库（隐藏入口）
            </span>
          </div>

          <!-- 生成场景牌 -->
          <div class="control-group">
            <label>大屁牌数量:</label>
            <select v-model="bigFartCount" @change="generateCards">
              <option v-for="i in 5" :key="i" :value="i-1">{{ i-1 }}张</option>
            </select>
            <button class="btn" @click="generateCards">🎲 重新生成</button>
          </div>

          <!-- 权限显示 -->
          <div class="permissions">
            <h3>🔐 当前权限:</h3>
            <ul>
              <li>ℹ️ 只能看到已揭示的牌</li>
              <li v-if="canRevealCards">✅ 可以揭示场景牌（房主）</li>
              <li v-else>❌ 无权揭示场景牌</li>
              <li v-if="canRevealAll">✅ 可以临时查看牌库（屁者特权）</li>
            </ul>
          </div>

          <!-- 屁者牌库查看控制 -->
          <div v-if="userRole === 'assassin'" class="assassin-controls">
            <button
              class="btn btn-assassin"
              @click="toggleAssassinView"
              :class="{ active: isAssassinViewing }"
            >
              {{ isAssassinViewing ? '👁️ 查看牌库中...' : '👁️ 查看牌库' }}
            </button>
            <span class="hint">
              {{ isAssassinViewing ? '点击"看完了"恢复正常视角' : '点击可临时查看所有8张牌' }}
            </span>
          </div>
        </div>
      </section>

      <!-- 游戏信息 -->
      <section class="game-info">
        <h2>📊 游戏状态</h2>
        <div class="info-grid">
          <div class="info-item">
            <strong>当前楼层:</strong>
            <span>{{ currentFloor }}F</span>
          </div>
          <div class="info-item">
            <strong>已揭示有屁牌:</strong>
            <span>{{ fartCardsRevealedCount }} / 4</span>
          </div>
          <div class="info-item">
            <strong>下一张牌:</strong>
            <span>{{ nextFloorToReveal ? nextFloorToReveal + 'F' : '全部揭示完成' }}</span>
          </div>
          <div class="info-item">
            <strong>总揭示牌数:</strong>
            <span>{{ revealedCount }} / 8</span>
          </div>
        </div>

        <!-- 房主操作按钮 -->
        <div v-if="canRevealCards" class="host-actions">
          <button
            class="btn btn-primary btn-large"
            @click="revealNextCard"
            :disabled="!nextFloorToReveal"
          >
            {{ nextFloorToReveal ? `📤 揭示下一楼层 (${nextFloorToReveal}F)` : '✅ 所有楼层已揭示' }}
          </button>

          <!-- 结算按钮（4张有屁牌全部揭示后出现） -->
          <button
            v-if="fartCardsRevealedCount >= 4"
            class="btn btn-settlement"
            @click="triggerSettlement"
          >
            🏁 终局结算
          </button>

        </div>
      </section>

      <!-- 场景牌显示区域 -->
      <section class="cards-display">
        <h2>🏢 电梯楼层 ({{ sortedFloors.length }}张牌)</h2>
        <div class="cards-grid">
          <div
            v-for="floor in sortedFloors"
            :key="floor"
            class="card-item"
            :class="{
              'revealed': getCard(floor)?.revealed,
              'hidden': !getCard(floor)?.revealed && !isAssassinViewing,
              'fart-card': getCard(floor)?.hasFart,
              'big-fart': isBigFartCard(floor),
              'current-floor': floor === nextFloorToReveal
            }"
            @click="showCardEffect(floor)"
          >
            <div class="floor-number">{{ floor }}F</div>

            <!-- 牌面内容 -->
            <div class="card-content">
              <!-- 未揭示状态 -->
              <div v-if="!getCard(floor)?.revealed && !isAssassinViewing" class="hidden-state">
                ████
              </div>

              <!-- 已揭示状态 -->
              <div v-else-if="getCard(floor)?.revealed" class="revealed-state">
                <div class="card-name">{{ getCard(floor)?.cardName }}</div>
                <div v-if="isBigFartCard(floor)" class="big-fart-indicator">
                  💥 可点击查看效果
                </div>
              </div>

              <!-- 屁者查看模式：显示未揭示的牌内容 -->
              <div v-else-if="isAssassinViewing" class="assassin-view-state">
                <div class="card-name">{{ getCard(floor)?.cardName }}</div>
                <div class="lock-indicator">👁️ 屁者查看模式</div>
              </div>
            </div>

            <!-- 卡牌类型标识 -->
            <div class="card-badge" :class="getCardBadgeClass(floor)">
              {{ getCardBadgeText(floor) }}
            </div>
          </div>
        </div>
      </section>

      <!-- 卡牌效果弹窗 -->
      <div v-if="selectedCard" class="modal-overlay" @click="closeModal">
        <div class="modal" @click.stop>
          <div class="modal-header">
            <h3>{{ selectedCard.cardName }}</h3>
            <button class="btn-close" @click="closeModal">×</button>
          </div>
          <div class="modal-body">
            <div class="effect-label">卡牌效果:</div>
            <div class="effect-text">{{ selectedCard.cardEffect }}</div>

            <div class="card-details">
              <div class="detail-item">
                <strong>楼层:</strong> {{ selectedCard.floor }}F
              </div>
              <div class="detail-item">
                <strong>类型:</strong> {{ selectedCard.hasFart ? '有屁牌' : '无屁牌' }}
              </div>
              <div class="detail-item">
                <strong>状态:</strong> {{ selectedCard.revealed ? '已揭示' : '未揭示' }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 玩家列表 -->
      <section class="players-section">
        <h2>👥 玩家列表</h2>
        <div class="players-actions">
          <button class="btn btn-primary" @click="generatePlayers">
            👥 生成模拟玩家
          </button>
        </div>
        <div class="players-grid">
          <div
            v-for="player in players"
            :key="player.id"
            class="player-card"
            :class="{ 'out': player.status === 'out' }"
          >
            <div class="player-header">
              <strong>{{ player.name }}</strong>
              <span class="player-id">{{ player.id }}</span>
            </div>
            <div class="player-info">
              <div class="info-row">
                <span class="label">身份:</span>
                <span class="value">
                  {{ player.identity === 'assassin' ? '💀 屁者' : '👤 乘客' }}
                </span>
              </div>
              <div class="info-row">
                <span class="label">状态:</span>
                <span class="value">
                  {{ player.status === 'alive' ? '✅ 存活' : '❌ 出局' }}
                </span>
              </div>
            </div>
            <div class="player-actions" v-if="canRevealCards && player.status === 'alive'">
              <button class="btn btn-danger btn-small" @click="eliminatePlayer(player.id)">
                💀 让其出局
              </button>
            </div>
          </div>
          <div v-if="players.length === 0" class="players-empty">
            点击"生成模拟玩家"创建6个测试玩家
          </div>
        </div>
      </section>

      <!-- 游戏结果 -->
      <section v-if="gameResult" class="result-section">
        <h2>🎉 游戏结束</h2>
        <div class="result-card">
          <div class="winner-badge">
            <div class="trophy">🏆</div>
            <h3>获胜阵营</h3>
            <p class="winner-name">
              {{ gameResult.winner === 'passenger' ? '👤 乘客阵营' : '💀 屁者阵营' }}
            </p>
          </div>
          <div class="reason-box">
            <strong>胜利原因:</strong>
            <p>{{ gameResult.reason }}</p>
          </div>
          <div class="statistics-box">
            <strong>统计信息:</strong>
            <ul>
              <li>揭示有屁牌: {{ fartCardsRevealedCount }}张</li>
            </ul>
          </div>
        </div>
      </section>

      <!-- 操作日志 -->
      <section class="log-section">
        <h2>📝 操作日志</h2>
        <div class="log-container">
          <div
            v-for="(log, index) in logs"
            :key="index"
            class="log-item"
            :class="log.type"
          >
            <span class="log-time">{{ formatTime(log.time) }}</span>
            <span class="log-message">{{ log.message }}</span>
          </div>
          <div v-if="logs.length === 0" class="log-empty">
            暂无操作日志
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'
import {
  generateScenarioCards,
  getNextFloorToReveal,
  revealCard,
  getRevealedFartCardCount,
  getRevealedCards,
  getCardByFloor,
  getCardDistribution,
  validateScenarioCards
} from '../config/games/piZheXianZhiCardGenerator'
import { CARD_EFFECTS } from '../config/games/piZheXianZhiCardEffects'
import { checkGameEnd } from '../config/games/piZheXianZhiIdentityLogic'
import { PLAYER_IDENTITY } from '../config/games/piZheXianZhiDataModel'

export default {
  name: 'ScenarioCardsTestView',
  setup() {
    // 状态管理
    const bigFartCount = ref(1)
    const scenarioCards = ref({})
    const currentFloor = ref(1)
    const userRole = ref('host') // 'host' | 'player' | 'assassin'
    const isAssassinViewing = ref(false) // 屁者是否在查看牌库模式
    const selectedCard = ref(null)
    const logs = ref([])

    // 玩家管理
    const players = ref([])
    const gameResult = ref(null)

    // 生成场景牌
    const generateCards = () => {
      try {
        scenarioCards.value = generateScenarioCards(bigFartCount.value)
        currentFloor.value = 1
        isAssassinViewing.value = false
        addLog('info', `生成新场景牌: 大屁${bigFartCount.value}张, 小屁${4 - bigFartCount.value}张`)
        addLog('info', '场景牌已重置，所有牌均为未揭示状态')
      } catch (error) {
        console.error('生成场景牌失败:', error)
        addLog('error', `生成失败: ${error.message}`)
        alert('生成场景牌失败: ' + error.message)
      }
    }

    // 生成模拟玩家（2个屁者 + 4个乘客）
    const generatePlayers = () => {
      const newPlayers = [
        { id: 'player1', name: '张三', identity: PLAYER_IDENTITY.ASSASSIN, status: 'alive' },
        { id: 'player2', name: '李四', identity: PLAYER_IDENTITY.PASSENGER, status: 'alive' },
        { id: 'player3', name: '王五', identity: PLAYER_IDENTITY.ASSASSIN, status: 'alive' },
        { id: 'player4', name: '赵六', identity: PLAYER_IDENTITY.PASSENGER, status: 'alive' },
        { id: 'player5', name: '孙七', identity: PLAYER_IDENTITY.PASSENGER, status: 'alive' },
        { id: 'player6', name: '周八', identity: PLAYER_IDENTITY.PASSENGER, status: 'alive' }
      ]
      players.value = newPlayers
      gameResult.value = null
      addLog('success', `生成6个玩家: 2个屁者 + 4个乘客`)
    }

    // 让玩家出局
    const eliminatePlayer = (playerId) => {
      const player = players.value.find(p => p.id === playerId)
      if (!player) {
        addLog('error', '玩家不存在')
        return
      }

      if (player.status === 'out') {
        addLog('warning', `${player.name} 已经出局`)
        return
      }

      player.status = 'out'
      addLog('warning', `💀 ${player.name} 出局`)

      // 检查胜负条件
      checkWinCondition()
    }

    // 检查胜负条件
    const checkWinCondition = () => {
      const fartCardsRevealed = getRevealedFartCardCount(scenarioCards.value)
      const result = checkGameEnd(players.value, fartCardsRevealed)

      if (result) {
        gameResult.value = result
        const winnerText = result.winner === PLAYER_IDENTITY.PASSENGER ? '乘客阵营' : '屁者阵营'
        addLog('success', `🎉 游戏结束！${winnerText}获胜 - ${result.reason}`)
      }
    }

    // 权限计算
    const canRevealCards = computed(() => {
      return userRole.value === 'host'
    })

    const canRevealAll = computed(() => {
      return userRole.value === 'assassin'
    })

    // 检查是否可以查看所有卡牌（屁者特权）
    const canViewAllCards = computed(() => {
      return userRole.value === 'assassin' && isAssassinViewing.value
    })

    // 楼层排序
    const sortedFloors = computed(() => {
      return Object.keys(scenarioCards.value)
        .map(Number)
        .sort((a, b) => a - b)
    })

    // 获取卡牌
    const getCard = (floor) => {
      return getCardByFloor(scenarioCards.value, floor)
    }

    // 获取下一张要揭示的楼层
    const nextFloorToReveal = computed(() => {
      return getNextFloorToReveal(scenarioCards.value)
    })

    // 已揭示的有屁牌数量
    const fartCardsRevealedCount = computed(() => {
      return getRevealedFartCardCount(scenarioCards.value)
    })

    // 已揭示的牌总数
    const revealedCount = computed(() => {
      return getRevealedCards(scenarioCards.value).length
    })

    // 检查是否为大屁牌
    const isBigFartCard = (floor) => {
      const card = getCard(floor)
      if (!card) return false
      const cardInfo = CARD_EFFECTS[card.cardType]
      return cardInfo?.isBigFart || false
    }

    // 获取卡牌徽章样式
    const getCardBadgeClass = (floor) => {
      const card = getCard(floor)
      if (!card) return ''

      if (!card.revealed && !canViewAllCards.value && !isAssassinViewing.value) {
        return 'badge-hidden'
      }

      if (card.hasFart) {
        return card.cardType === '有屁' ? 'badge-small-fart' : 'badge-big-fart'
      }

      return 'badge-no-fart'
    }

    // 获取卡牌徽章文本
    const getCardBadgeText = (floor) => {
      const card = getCard(floor)
      if (!card) return ''

      if (!card.revealed && !canViewAllCards.value && !isAssassinViewing.value) {
        return '未揭示'
      }

      if (card.hasFart) {
        return card.cardType === '有屁' ? '小屁牌' : '大屁牌'
      }

      return '无屁牌'
    }

    // 更新显示模式
    const updateDisplayMode = () => {
      isAssassinViewing.value = false
      addLog('info', `切换身份为: ${userRole.value}`)
    }

    // 揭示下一张牌
    const revealNextCard = () => {
      const floor = nextFloorToReveal.value
      if (!floor) {
        addLog('warning', '所有楼层都已揭示')
        return
      }

      try {
        revealCard(scenarioCards.value, floor)
        const card = getCard(floor)
        addLog('success', `揭示 ${floor}F: ${card.cardName}`)

        // 检查是否所有有屁牌都已揭示，自动触发结算
        const fartCardsRevealed = getRevealedFartCardCount(scenarioCards.value)
        if (fartCardsRevealed >= 4) {
          addLog('info', '✅ 所有有屁牌已揭示，执行终局结算')
          checkWinCondition()
        }
      } catch (error) {
        console.error('揭示失败:', error)
        addLog('error', `揭示失败: ${error.message}`)
        alert('揭示失败: ' + error.message)
      }
    }

    // 触发结算（手动）
    const triggerSettlement = () => {
      addLog('info', '🧮 执行终局结算判定...')
      checkWinCondition()
    }

    // 监听场景牌变化，自动检查结算条件
    watch(() => scenarioCards.value, () => {
      if (Object.keys(scenarioCards.value).length > 0) {
        const fartCardsRevealed = getRevealedFartCardCount(scenarioCards.value)
        if (fartCardsRevealed >= 4 && !gameResult.value) {
          addLog('info', '🎯 检测到所有有屁牌已揭示，自动执行结算判定')
          checkWinCondition()
        }
      }
    }, { deep: true })

    // 切换屁者查看模式
    const toggleAssassinView = () => {
      isAssassinViewing.value = !isAssassinViewing.value
      if (isAssassinViewing.value) {
        addLog('info', '💀 屁者模式: 临时查看所有牌库')
      } else {
        addLog('info', '💀 退出屁者模式')
      }
    }

    // 显示卡牌效果
    const showCardEffect = (floor) => {
      const card = getCard(floor)
      if (!card) return

      // 大屁牌可以点击查看效果
      if (card.revealed && isBigFartCard(floor)) {
        selectedCard.value = card
        return
      }

      // 屁者在查看模式可以查看所有牌
      if (userRole.value === 'assassin' && isAssassinViewing.value) {
        selectedCard.value = card
        return
      }
    }

    // 关闭弹窗
    const closeModal = () => {
      selectedCard.value = null
    }

    // 添加日志
    const addLog = (type, message) => {
      logs.value.unshift({
        type, // 'info' | 'success' | 'warning' | 'error'
        message,
        time: Date.now()
      })

      // 保持最近50条日志
      if (logs.value.length > 50) {
        logs.value = logs.value.slice(0, 50)
      }
    }

    // 格式化时间
    const formatTime = (timestamp) => {
      const date = new Date(timestamp)
      return date.toLocaleTimeString('zh-CN', { hour12: false })
    }

    // 初始化
    generateCards()

    return {
      bigFartCount,
      scenarioCards,
      currentFloor,
      userRole,
      isAssassinViewing,
      selectedCard,
      logs,
      players,
      gameResult,
      sortedFloors,
      nextFloorToReveal,
      fartCardsRevealedCount,
      revealedCount,
      canViewAllCards,
      canRevealCards,
      canRevealAll,
      generateCards,
      generatePlayers,
      updateDisplayMode,
      revealNextCard,
      triggerSettlement,
      eliminatePlayer,
      toggleAssassinView,
      showCardEffect,
      closeModal,
      getCard,
      isBigFartCard,
      getCardBadgeClass,
      getCardBadgeText,
      formatTime
    }
  }
}
</script>

<style scoped>
#scenario-cards-test {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.container {
  max-width: 1200px;
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

section {
  margin-bottom: 30px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
}

.control-panel .controls {
  display: grid;
  gap: 20px;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.control-group label {
  font-weight: bold;
  color: #555;
  min-width: 100px;
}

.control-group select {
  padding: 8px 12px;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 1em;
}

.hint {
  color: #999;
  font-size: 0.9em;
  font-style: italic;
}

.permissions {
  background: white;
  padding: 15px;
  border-radius: 8px;
  border-left: 4px solid #42b983;
}

.permissions h3 {
  margin-top: 0;
  margin-bottom: 10px;
}

.permissions ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.permissions li {
  padding: 5px 0;
  color: #555;
}

.assassin-controls {
  display: flex;
  align-items: center;
  gap: 15px;
  background: #fff3e0;
  padding: 15px;
  border-radius: 8px;
  border-left: 4px solid #ff9800;
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

.btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-primary {
  background: #2196f3;
}

.btn-primary:hover {
  background: #1976d2;
}

.btn-settlement {
  background: #9c27b0;
}

.btn-settlement:hover {
  background: #7b1fa2;
}

.btn-danger {
  background: #f44336;
}

.btn-danger:hover {
  background: #d32f2f;
}

.btn-assassin {
  background: #ff5722;
}

.btn-assassin:hover {
  background: #e64a19;
}

.btn-assassin.active {
  background: #ff9800;
  box-shadow: 0 0 10px rgba(255, 152, 0, 0.5);
}

.btn-large {
  padding: 15px 30px;
  font-size: 1.1em;
}

.game-info .info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.info-item {
  background: white;
  padding: 15px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-item strong {
  color: #555;
}

.info-item span {
  color: #42b983;
  font-weight: bold;
  font-size: 1.1em;
}

.host-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 15px;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 15px;
}

.card-item {
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  padding: 15px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}

.card-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.card-item.revealed {
  border-color: #42b983;
}

.card-item.fart-card.revealed {
  background: linear-gradient(135deg, #fff5f5 0%, #ffe0e0 100%);
}

.card-item.big-fart.revealed {
  border-color: #e74c3c;
  box-shadow: 0 0 10px rgba(231, 76, 60, 0.3);
}

.card-item.current-floor {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(66, 185, 131, 0.7);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(66, 185, 131, 0);
  }
}

.floor-number {
  font-size: 1.5em;
  font-weight: bold;
  color: #666;
  margin-bottom: 10px;
}

.card-content {
  min-height: 60px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.hidden-state {
  color: #999;
  font-size: 1.2em;
  letter-spacing: 2px;
}

.revealed-state .card-name {
  font-size: 1.1em;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.big-fart-indicator {
  color: #e74c3c;
  font-size: 0.85em;
}

.private-state .card-name {
  font-size: 1em;
  color: #666;
  font-style: italic;
}

.lock-indicator {
  color: #999;
  font-size: 0.8em;
  margin-top: 5px;
}

.card-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75em;
  font-weight: bold;
}

.badge-hidden {
  background: #e0e0e0;
  color: #999;
}

.badge-no-fart {
  background: #e8f5e9;
  color: #4caf50;
}

.badge-small-fart {
  background: #fff3e0;
  color: #ff9800;
}

.badge-big-fart {
  background: #ffebee;
  color: #f44336;
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  animation: modalSlideIn 0.3s ease;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-50px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 2px solid #eee;
}

.modal-header h3 {
  margin: 0;
  color: #333;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5em;
  cursor: pointer;
  color: #999;
  padding: 0;
  width: 30px;
  height: 30px;
}

.btn-close:hover {
  color: #666;
}

.modal-body {
  padding: 20px;
}

.effect-label {
  font-weight: bold;
  color: #555;
  margin-bottom: 10px;
}

.effect-text {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 8px;
  color: #333;
  line-height: 1.6;
  margin-bottom: 20px;
}

.card-details {
  display: grid;
  gap: 10px;
}

.detail-item {
  color: #666;
}

/* 日志样式 */
.log-section .log-container {
  background: white;
  border-radius: 8px;
  max-height: 300px;
  overflow-y: auto;
  padding: 15px;
}

.log-item {
  display: flex;
  gap: 10px;
  padding: 8px;
  margin-bottom: 5px;
  border-radius: 6px;
  font-size: 0.9em;
}

.log-item.info {
  background: #e3f2fd;
}

.log-item.success {
  background: #e8f5e9;
}

.log-item.warning {
  background: #fff3e0;
}

.log-item.error {
  background: #ffebee;
}

.log-time {
  color: #999;
  font-size: 0.85em;
  white-space: nowrap;
}

.log-message {
  flex: 1;
}

.log-empty {
  text-align: center;
  color: #999;
  padding: 40px;
}

/* 玩家列表样式 */
.players-actions {
  margin-bottom: 20px;
}

.players-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 15px;
}

.player-card {
  background: white;
  padding: 15px;
  border-radius: 10px;
  border: 2px solid #e0e0e0;
  transition: all 0.3s;
}

.player-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.player-card.out {
  opacity: 0.6;
  background: #f5f5f5;
  border-color: #ccc;
}

.player-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.player-header strong {
  color: #333;
}

.player-id {
  font-size: 0.8em;
  color: #999;
}

.player-info {
  display: grid;
  gap: 5px;
  margin-bottom: 10px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.9em;
}

.info-row .label {
  color: #666;
}

.info-row .value {
  color: #333;
  font-weight: 500;
}

.player-actions {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #eee;
}

.players-empty {
  text-align: center;
  color: #999;
  padding: 40px;
  grid-column: 1 / -1;
}

/* 游戏结果样式 */
.result-section {
  background: linear-gradient(135deg, #fff9e6 0%, #ffe6e6 100%);
}

.result-card {
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.winner-badge {
  text-align: center;
  margin-bottom: 30px;
}

.trophy {
  font-size: 4em;
  margin-bottom: 10px;
}

.winner-badge h3 {
  margin: 10px 0;
  color: #856404;
  font-size: 1.2em;
}

.winner-name {
  font-size: 2em;
  font-weight: bold;
  color: #856404;
  margin: 10px 0 0 0;
}

.reason-box {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 10px;
  border-left: 4px solid #42b983;
  margin-bottom: 20px;
}

.reason-box strong {
  display: block;
  margin-bottom: 10px;
  color: #555;
}

.reason-box p {
  margin: 0;
  color: #333;
  font-size: 1.1em;
}

.statistics-box {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 10px;
}

.statistics-box strong {
  display: block;
  margin-bottom: 10px;
  color: #555;
}

.statistics-box ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.statistics-box li {
  padding: 5px 0;
  color: #666;
}
</style>
