<template>
  <div id="game">
    <div class="game-container">
      <!-- 游戏头部 -->
      <header class="game-header">
        <div>
          <h1>🎯 屁者先知</h1>
          <div class="room-info">
            <span class="room-id">房间号: {{ roomId }}</span>
            <button class="btn-copy" @click="copyRoomId">📋 复制</button>
          </div>
        </div>
        <div class="player-info" v-if="currentPlayer">
          <span class="player-avatar">{{ currentPlayer.avatar || '😊' }}</span>
          <span class="player-name">{{ currentPlayer.name }}</span>
          <span v-if="currentPlayer.identity" class="player-identity-badge">
            {{ getIdentityText(currentPlayer.identity) }}
          </span>
          <span v-if="currentPlayer.status === 'out'" class="status-eliminated">
            💀 已出局
          </span>
        </div>
      </header>

      <!-- 主游戏区域 -->
      <div class="game-main">
        <!-- 左侧：电梯楼层和卡牌 -->
        <div class="left-panel">
          <!-- 电梯显示区 -->
          <section class="elevator-section">
            <div class="elevator-header">
              <h2>🏢 电梯楼层 ({{ sortedFloors.length }}张牌)</h2>
              <button
                v-if="isCurrentPlayerAssassin"
                class="btn-eye-small"
                :class="{ 'active': isAllFloorsRevealed }"
                @click="toggleAllFloorsReveal"
                :title="isAllFloorsRevealed ? '隐藏全部楼层牌' : '揭示全部楼层牌'"
              >
                <span class="eye-icon">{{ isAllFloorsRevealed ? '🙈' : '👁️' }}</span>
              </button>
            </div>
            <div class="elevator-grid">
              <div
                v-for="floor in sortedFloors"
                :key="floor"
                class="floor-card"
                :class="{
                  'revealed': getCard(floor)?.revealed || isAllFloorsRevealed,
                  'hidden': !getCard(floor)?.revealed && !isAssassinViewing && !isAllFloorsRevealed,
                  'fart-card': getCard(floor)?.hasFart,
                  'big-fart': isBigFartCard(floor),
                  'current-floor': floor === nextFloorToReveal
                }"
                @click="showCardEffect(floor)"
              >
                <div class="floor-header">
                  <div class="floor-number">{{ floor }}F</div>
                  <div class="floor-status-badge" :class="getCardBadgeClass(floor)">
                    {{ getCardBadgeText(floor) }}
                  </div>
                </div>

                <!-- 卡牌内容 -->
                <div class="card-content">
                  <div v-if="!getCard(floor)?.revealed && !isAssassinViewing && !isAllFloorsRevealed" class="hidden-content">
                    ████
                  </div>
                  <div v-else-if="getCard(floor)?.revealed || isAllFloorsRevealed" class="revealed-content">
                    <div class="card-name">{{ getCard(floor)?.cardName }}</div>
                    <div v-if="isBigFartCard(floor)" class="big-fart-tip">
                      💥 可点击查看
                    </div>
                  </div>
                  <div v-else-if="isAssassinViewing" class="assassin-content">
                    <div class="card-name">{{ getCard(floor)?.cardName }}</div>
                    <div class="assassin-tip">👁️ 屁者模式</div>
                  </div>
                </div>

                <!-- 当前楼层指示器 -->
                <div v-if="floor === nextFloorToReveal" class="pulse-indicator"></div>
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
        </div>

        <!-- 右侧：玩家列表和控制面板 -->
        <div class="right-panel">
          <!-- 玩家列表 -->
          <section class="players-section">
            <h2>👥 玩家 ({{ players.length }}人)</h2>
            <div class="players-list">
              <div
                v-for="player in sortedPlayers"
                :key="player.id"
                class="player-item"
                :class="{ 'out': player.status === 'out', 'me': player.id === myPlayerId }"
              >
                <div class="player-avatar">{{ player.avatar || '😊' }}</div>
                <div class="player-name">
                  <span class="player-sequence">({{ player.sequence || '?' }}号)</span>
                  {{ player.name }}
                </div>
                <div class="player-status" v-if="player.status === 'out'">💀</div>
                <div class="player-status not-ready" v-else-if="!player.ready && !player.identity">未准备</div>
              </div>
              <div v-if="players.length === 0" class="players-empty">
                等待玩家加入...
              </div>
            </div>
          </section>

          <!-- 身份和序号选择（所有玩家可见，游戏进行中但未选择身份时显示） -->
          <section v-if="roomData?.status === 'playing' && !currentPlayer?.identity" class="identity-selection-section">
            <h2>🎭 选择身份和序号</h2>
            <div class="identity-selection-content">
              <p class="selection-title">请选择你的序号和身份，选择后无法更改</p>

              <!-- 序号选择 -->
              <div class="sequence-selection-block">
                <label class="label">选择序号：</label>
                <div class="sequence-buttons">
                  <button
                    v-for="n in players.length"
                    :key="n"
                    class="btn-sequence"
                    :class="{ 'selected': selectedSequence === n }"
                    @click="selectedSequence = n"
                    :disabled="isSequenceTaken(n)"
                  >
                    {{ n }}号
                  </button>
                </div>
              </div>

              <!-- 身份选择 -->
              <div class="identity-selection-block">
                <label class="label">选择身份：</label>
                <div class="identity-buttons">
                  <button
                    class="btn-identity"
                    :class="{ 'selected': selectedIdentity === PLAYER_IDENTITY.PASSENGER }"
                    @click="selectedIdentity = PLAYER_IDENTITY.PASSENGER"
                  >
                    👤 乘客
                  </button>
                  <button
                    class="btn-identity assassin"
                    :class="{ 'selected': selectedIdentity === PLAYER_IDENTITY.ASSASSIN }"
                    @click="selectedIdentity = PLAYER_IDENTITY.ASSASSIN"
                  >
                    💨 屁者
                  </button>
                </div>
              </div>

              <!-- 准备按钮 -->
              <button
                class="btn-ready"
                @click="confirmSelection"
                :disabled="!selectedIdentity || !selectedSequence"
              >
                ✅ 确认选择
              </button>
            </div>
          </section>

          <!-- 等待开始游戏状态 -->
          <section class="waiting-section" v-if="roomData && roomData.status !== 'playing'">
            <div class="waiting-content">
              <div class="waiting-icon">⏳</div>
              <h2>等待房主开始游戏</h2>
              <p v-if="canRevealCards" class="waiting-text">
                您是房主，点击下方按钮开始游戏
              </p>
              <p v-else class="waiting-text">
                等待房主开始游戏...
              </p>
            </div>
            <div v-if="canRevealCards" class="host-init-controls">
              <button
                class="btn-primary btn-large"
                @click="initGame(1)"
                :disabled="isLoading"
              >
                🎮 开始游戏
              </button>
            </div>
          </section>

          <!-- 游戏控制面板（仅房主可见） -->
          <section class="control-panel" v-if="roomData?.status === 'playing' && canRevealCards">
            <h2>🎮 游戏控制</h2>

            <!-- 房主操作 -->
            <div v-if="canRevealCards" class="host-controls">
              <button
                class="btn-primary"
                @click="revealNextCard(myPlayerId)"
                :disabled="!nextFloorToReveal"
              >
                {{ nextFloorToReveal ? `📤 揭示 ${nextFloorToReveal}F` : '✅ 全部揭示完成' }}
              </button>

              <button
                v-if="fartCardsRevealedCount >= 4"
                class="btn-settlement"
                @click="triggerSettlement(myPlayerId)"
              >
                🏁 终局结算
              </button>

              <!-- 玩家出局操作 -->
              <div class="eliminate-section">
                <label class="eliminate-label">让玩家出局：</label>
                <select v-model="selectedPlayerToEliminate" class="eliminate-select">
                  <option :value="null">选择玩家...</option>
                  <option
                    v-for="player in players.filter(p => p.status !== 'out' && p.id !== myPlayerId)"
                    :key="player.id"
                    :value="player.id"
                  >
                    ({{ player.sequence || '?' }}号) {{ player.name }}
                  </option>
                </select>
                <button
                  class="btn-eliminate"
                  @click="eliminateSelectedPlayer"
                  :disabled="!selectedPlayerToEliminate"
                >
                  💀 让其出局
                </button>
              </div>

              <button
                class="btn-secondary"
                @click="initGame(1)"
                :disabled="isLoading"
              >
                🔄 重新开始
              </button>
            </div>
          </section>

          <!-- 游戏结果 -->
          <section v-if="gameResult" class="result-section">
            <div class="result-banner">
              <div class="trophy">🏆</div>
              <h2>游戏结束</h2>
              <div class="winner-text">
                {{ gameResult.winner === PLAYER_IDENTITY.PASSENGER ? '👤 乘客阵营获胜' : '💨 屁者阵营获胜' }}
              </div>
              <div class="result-reason">
                {{ gameResult.reason }}
              </div>
            </div>

            <div class="result-stats">
              <h3>📊 游戏统计</h3>
              <ul>
                <li>揭示有屁牌: {{ gameResult.statistics?.fartCardsRevealed || 0 }}张</li>
                <li>存活乘客: {{ gameResult.statistics?.passengersAlive || 0 }}人</li>
                <li>存活屁者: {{ gameResult.statistics?.assassinsAlive || 0 }}人</li>
              </ul>
            </div>

            <button class="btn-primary" @click="exitGame">
              返回大厅
            </button>
          </section>
        </div>
      </div>

      <!-- 退出按钮 -->
      <button class="btn-exit" @click="exitGame">
        🚪 退出游戏
      </button>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { database } from '../firebase'
import { ref as dbRef, update } from 'firebase/database'
import { usePiZheXianZhiGame } from '../composables/usePiZheXianZhiGame'
import { PLAYER_IDENTITY } from '../config/games/piZheXianZhiDataModel'
import { CARD_EFFECTS } from '../config/games/piZheXianZhiCardEffects'

export default {
  name: 'GameView',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const roomId = route.params.roomId

    // 初始化游戏逻辑
    const gameLogic = usePiZheXianZhiGame(roomId)

    // 本地状态
    const isAssassinViewing = ref(false)
    const isAllFloorsRevealed = ref(false)
    const selectedCard = ref(null)
    const myPlayerId = ref(localStorage.getItem('playerId') || '')
    const selectedSequence = ref(null)
    const selectedIdentity = ref(null)
    const selectedPlayerToEliminate = ref(null)

    // 从 gameLogic 获取数据
    const {
      roomData,
      players,
      scenarioCards,
      gameResult,
      isLoading,
      nextFloorToReveal,
      fartCardsRevealedCount,
      initGame,
      revealNextCard,
      triggerSettlement,
      eliminatePlayer,
      selectPlayerIdentity,
      isHost,
      isAssassin,
      cleanup
    } = gameLogic

    // 计算属性
    const currentPlayer = computed(() => {
      return players.value.find(p => p.id === myPlayerId.value)
    })

    const canRevealCards = computed(() => {
      return isHost(myPlayerId.value)
    })

    const isCurrentPlayerAssassin = computed(() => {
      return isAssassin(myPlayerId.value)
    })

    const sortedPlayers = computed(() => {
      return [...players.value].sort((a, b) => {
        // 未选择序号的玩家排到最后
        if (!a.sequence && b.sequence) return 1
        if (a.sequence && !b.sequence) return -1
        if (!a.sequence && !b.sequence) return 0
        return a.sequence - b.sequence
      })
    })

    const sortedFloors = computed(() => {
      return Object.keys(scenarioCards.value)
        .map(Number)
        .sort((a, b) => a - b)
    })

    const getCard = (floor) => {
      return scenarioCards.value[floor]
    }

    const isBigFartCard = (floor) => {
      const card = getCard(floor)
      if (!card) return false
      const cardInfo = CARD_EFFECTS[card.cardType]
      return cardInfo?.isBigFart || false
    }

    const getCardBadgeClass = (floor) => {
      const card = getCard(floor)
      if (!card) return ''

      if (!card.revealed && !isAssassinViewing.value && !isAllFloorsRevealed.value) {
        return 'badge-hidden'
      }

      if (card.hasFart) {
        return card.cardType === '有屁' ? 'badge-small-fart' : 'badge-big-fart'
      }

      return 'badge-no-fart'
    }

    const getCardBadgeText = (floor) => {
      const card = getCard(floor)
      if (!card) return ''

      if (!card.revealed && !isAssassinViewing.value && !isAllFloorsRevealed.value) {
        return '未揭示'
      }

      if (card.hasFart) {
        return card.cardType === '有屁' ? '小屁牌' : '大屁牌'
      }

      return '无屁牌'
    }

    const getRoleText = (player) => {
      if (player.id === roomData.value?.hostId) return '👑 房主'
      if (player.identity === PLAYER_IDENTITY.ASSASSIN) return '💨 屁者'
      return '👤 乘客'
    }

    const getIdentityText = (identity) => {
      return identity === PLAYER_IDENTITY.ASSASSIN ? '💨 屁者' : '👤 乘客'
    }

    // 方法
    const copyRoomId = async () => {
      try {
        await navigator.clipboard.writeText(roomId)
        alert('房间号已复制到剪贴板！')
      } catch (err) {
        alert('复制失败，请手动复制')
      }
    }

    const showCardEffect = (floor) => {
      const card = getCard(floor)
      if (!card) return

      // 大屁牌可以点击查看效果
      if (card.revealed && isBigFartCard(floor)) {
        selectedCard.value = card
        return
      }

      // 屁者在查看模式可以查看所有牌
      if (isAssassinViewing.value) {
        selectedCard.value = card
        return
      }
    }

    const closeModal = () => {
      selectedCard.value = null
    }

    const toggleAssassinView = () => {
      isAssassinViewing.value = !isAssassinViewing.value
    }

    const toggleAllFloorsReveal = () => {
      isAllFloorsRevealed.value = !isAllFloorsRevealed.value
      // 关闭屁者查看模式
      isAssassinViewing.value = false
    }

    // 让选中的玩家出局
    const eliminateSelectedPlayer = async () => {
      if (!selectedPlayerToEliminate.value) {
        alert('请选择要出局的玩家')
        return
      }

      const player = players.value.find(p => p.id === selectedPlayerToEliminate.value)
      if (!player) {
        alert('玩家不存在')
        return
      }

      if (!confirm(`确定要让 ${player.name} 出局吗？`)) {
        return
      }

      try {
        await eliminatePlayer(myPlayerId.value, selectedPlayerToEliminate.value)
        selectedPlayerToEliminate.value = null
      } catch (err) {
        alert('让玩家出局失败: ' + err.message)
      }
    }

    // 检查序号是否已被占用
    const isSequenceTaken = (sequence) => {
      return players.value.some(p => p.sequence === sequence && p.id !== myPlayerId.value)
    }

    // 确认选择序号和身份
    const confirmSelection = async () => {
      if (!selectedSequence.value || !selectedIdentity.value) {
        alert('请选择序号和身份')
        return
      }

      if (isSequenceTaken(selectedSequence.value)) {
        alert('该序号已被占用，请选择其他序号')
        return
      }

      if (!myPlayerId.value) {
        alert('未找到玩家信息')
        return
      }

      try {
        // 更新玩家序号和身份
        const playerRef = dbRef(database, `rooms/${roomId}/players/${myPlayerId.value}`)
        await update(playerRef, {
          sequence: selectedSequence.value,
          identity: selectedIdentity.value,
          ready: true
        })

        // 重置选择状态
        selectedSequence.value = null
        selectedIdentity.value = null
      } catch (err) {
        alert('确认选择失败: ' + err.message)
      }
    }

    const selectIdentity = async (identity) => {
      if (!myPlayerId.value) {
        alert('未找到玩家信息')
        return
      }

      try {
        await selectPlayerIdentity(myPlayerId.value, identity)
      } catch (err) {
        alert('身份选择失败: ' + err.message)
      }
    }

    const exitGame = async () => {
      if (!confirm('确定要退出游戏吗？房主退出将导致所有玩家一起返回大厅')) {
        return
      }

      try {
        // 如果是房主，广播退出消息（设置房间状态为 waiting）
        if (canRevealCards.value && roomData.value?.status === 'playing') {
          console.log('🎮 房主退出游戏，广播给所有玩家...')
          // 清除游戏相关数据，但保留玩家列表
          await update(dbRef(database, `rooms/${roomId}`), {
            status: 'waiting',
            gameType: null,
            // 清除游戏数据
            scenarioCards: null,
            gameResult: null,
            currentFloor: null,
            fartCardsRevealedCount: null
          })
        }

        // 跳转到大厅
        console.log('👋 跳转到大厅')
        router.push(`/lobby/${roomId}`)
      } catch (error) {
        console.error('退出游戏失败:', error)
        // 即使失败也跳转到大厅
        router.push(`/lobby/${roomId}`)
      }
    }

    // 生命周期
    onMounted(() => {
      // 如果没有玩家ID，重定向到大厅
      if (!myPlayerId.value) {
        router.push(`/lobby/${roomId}`)
        return
      }

      // 重置本地选择状态
      selectedSequence.value = null
      selectedIdentity.value = null
      isAllFloorsRevealed.value = false

      // 如果房间状态是 playing 且当前是房主，自动初始化游戏
      // 等待players加载完成后再初始化
      if (roomData.value?.status === 'playing' && canRevealCards.value) {
        console.log('🎮 检测到游戏已开始，等待数据加载完成...')

        // 使用 setTimeout 确保players数组已加载
        const checkAndInit = () => {
          if (players.value.length > 0) {
            console.log('👥 玩家数据已加载，开始初始化游戏...')
            initGame(1) // 使用默认的1张大屁牌
          } else {
            console.log('⏳ 等待玩家数据加载...')
            setTimeout(checkAndInit, 100)
          }
        }

        checkAndInit()
      }
    })

    onUnmounted(() => {
      cleanup()
    })

    // 监听房间状态变化
    const checkRoomStatus = () => {
      // 如果正在加载中，不进行检查（避免页面刷新时误判）
      if (isLoading.value) {
        return
      }

      // 如果房间不存在或被删除，返回大厅
      if (!roomData.value || Object.keys(roomData.value).length === 0) {
        console.log('房间已解散，返回大厅')
        router.push('/')
        return
      }

      // 如果房主离开，返回大厅
      if (!roomData.value.hostId) {
        console.log('房主已离开，房间解散')
        router.push(`/lobby/${roomId}`)
        return
      }

      // 如果游戏未开始，显示等待信息
      if (roomData.value.status === 'waiting') {
        console.log('等待房主开始游戏...')
      }

      // 如果游戏已开始，显示游戏界面
      if (roomData.value.status === 'playing') {
        console.log('游戏已开始')
      }
    }

    // 监听房间数据变化
    watch(() => roomData.value, (newVal, oldVal) => {
      if (newVal !== oldVal) {
        // 当房间状态从 playing 变为 waiting 时，自动返回大厅
        if (oldVal?.status === 'playing' && newVal?.status === 'waiting') {
          console.log('🎮 房主退出游戏，自动返回大厅')
          router.push(`/lobby/${roomId}`)
          return
        }
        checkRoomStatus()
      }
    }, { deep: true, immediate: true })

    return {
      roomId,
      roomData,
      players,
      scenarioCards,
      gameResult,
      isLoading,
      nextFloorToReveal,
      fartCardsRevealedCount,
      currentPlayer,
      canRevealCards,
      isCurrentPlayerAssassin,
      myPlayerId,
      sortedPlayers,
      sortedFloors,
      isAssassinViewing,
      isAllFloorsRevealed,
      selectedCard,
      selectedSequence,
      selectedIdentity,
      PLAYER_IDENTITY,
      getCard,
      isBigFartCard,
      getCardBadgeClass,
      getCardBadgeText,
      getRoleText,
      getIdentityText,
      copyRoomId,
      revealNextCard,
      triggerSettlement,
      eliminatePlayer,
      initGame,
      toggleAssassinView,
      toggleAllFloorsReveal,
      confirmSelection,
      isSequenceTaken,
      selectIdentity,
      showCardEffect,
      closeModal,
      exitGame
    }
  }
}
</script>

<style scoped>
#game {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.game-container {
  max-width: 1400px;
  margin: 0 auto;
}

.game-header {
  background: white;
  padding: 20px 30px;
  border-radius: 12px;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.game-header h1 {
  margin: 0 0 15px 0;
  color: #333;
  text-align: center;
}

.room-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 10px;
}

.room-id {
  font-weight: bold;
  color: #555;
}

.btn-copy {
  padding: 6px 12px;
  background: #42b983;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9em;
}

.btn-copy:hover {
  background: #359268;
}

.player-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  color: #666;
}

.player-name {
  font-weight: bold;
}

.player-role {
  padding: 4px 12px;
  background: #e3f2fd;
  border-radius: 12px;
  font-size: 0.9em;
}

.status-eliminated {
  padding: 4px 12px;
  background: #ffebee;
  border-radius: 12px;
  color: #e74c3c;
  font-weight: bold;
}

.game-main {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}

.left-panel, .right-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.elevator-section {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.elevator-section h2 {
  margin: 0;
  color: #333;
  font-size: 1.2em;
}

.elevator-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 15px;
}

.btn-eye-small {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #ff9800 0%, #ff5722 100%);
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.2em;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(255, 152, 0, 0.3);
}

.btn-eye-small:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 152, 0, 0.5);
}

.btn-eye-small.active {
  background: linear-gradient(135deg, #ff5722 0%, #e64a19 100%);
  box-shadow: 0 0 10px rgba(255, 87, 34, 0.6);
  animation: activeEyePulse 2s infinite;
}

.elevator-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 15px;
}

.floor-card {
  position: relative;
  background: #f8f9fa;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  padding: 15px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  overflow: hidden;
}

.floor-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.floor-card.revealed {
  background: white;
  border-color: #42b983;
}

.floor-card.fart-card.revealed {
  background: linear-gradient(135deg, #fff5f5 0%, #ffe0e0 100%);
}

.floor-card.big-fart.revealed {
  border-color: #e74c3c;
  box-shadow: 0 0 15px rgba(231, 76, 60, 0.3);
}

.floor-card.current-floor {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(66, 185, 131, 0.7);
  }
  50% {
    box-shadow: 0 0 0 15px rgba(66, 185, 131, 0);
  }
}

.floor-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 10px;
}

.floor-number {
  font-size: 1.5em;
  font-weight: bold;
  color: #666;
}

.floor-status-badge {
  margin-top: 5px;
  padding: 3px 8px;
  border-radius: 10px;
  font-size: 0.7em;
  font-weight: bold;
  white-space: nowrap;
}

.card-content {
  min-height: 80px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.hidden-content {
  color: #999;
  font-size: 1.2em;
  letter-spacing: 2px;
}

.revealed-content .card-name {
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.big-fart-tip {
  color: #e74c3c;
  font-size: 0.85em;
}

.assassin-content .card-name {
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.assassin-tip {
  color: #999;
  font-size: 0.85em;
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
  background: #ffffff;
  color: #ff9800;
  border: 1px solid #ff9800;
}

.badge-big-fart {
  background: #ffffff;
  color: #f44336;
  border: 1px solid #f44336;
}

.pulse-indicator {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 10px;
  height: 10px;
  background: #42b983;
  border-radius: 50%;
  animation: pulse-dot 1.5s infinite;
}

@keyframes pulse-dot {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
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

/* 玩家列表 */
.players-section {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.players-section h2 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 1.2em;
}

.players-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 400px;
  overflow-y: auto;
}

.player-card {
  background: #f8f9fa;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 12px;
  transition: all 0.3s;
}

.player-card:hover {
  transform: translateX(5px);
}

.player-card.me {
  border-color: #42b983;
  background: #f0f9f4;
}

.player-card.out {
  opacity: 0.6;
  background: #f5f5f5;
}

.player-card.out .player-name {
  text-decoration: line-through;
}

.player-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.player-name {
  font-weight: bold;
  color: #333;
}

.host-badge {
  font-size: 1.2em;
}

.player-info {
  display: grid;
  gap: 4px;
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
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #e0e0e0;
}

.btn-eliminate {
  width: 100%;
  padding: 6px 12px;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9em;
}

.btn-eliminate:hover {
  background: #d32f2f;
}

.players-empty {
  text-align: center;
  color: #999;
  padding: 40px;
}

/* 身份和序号选择区块 */
.identity-selection-section {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.identity-selection-section h2 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 1.2em;
}

.identity-selection-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.selection-title {
  text-align: center;
  color: #666;
  font-size: 0.95em;
  margin: 0;
  padding: 10px;
  background-color: #f0f9ff;
  border-radius: 6px;
  border-left: 4px solid #2196f3;
}

.sequence-selection-block,
.identity-selection-block {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.label {
  font-weight: 500;
  color: #333;
  font-size: 0.95em;
}

.sequence-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
  gap: 10px;
}

.identity-selection-block .identity-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.identity-buttons .btn-identity {
  padding: 12px 20px;
  border: 2px solid #6c757d;
  background-color: #fff;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s;
}

.identity-buttons .btn-identity:hover {
  background-color: #6c757d;
  color: #fff;
}

.identity-buttons .btn-identity.selected {
  background-color: #42b983;
  border-color: #42b983;
  color: #fff;
}

.identity-buttons .btn-identity.assassin.selected {
  background-color: #dc3545;
  border-color: #dc3545;
}

.btn-ready {
  padding: 15px;
  background-color: #28a745;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 1.1em;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  margin-top: 10px;
}

.btn-ready:hover:not(:disabled) {
  background-color: #218838;
}

.btn-ready:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 等待状态 */
.waiting-section {
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.waiting-content {
  margin-bottom: 30px;
}

.waiting-icon {
  font-size: 4em;
  margin-bottom: 15px;
  animation: waitingPulse 2s ease-in-out infinite;
}

@keyframes waitingPulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.waiting-section h2 {
  margin: 0 0 15px 0;
  color: #555;
  font-size: 1.5em;
}

.waiting-text {
  color: #666;
  font-size: 1.1em;
  margin: 0;
}

.host-init-controls {
  margin-top: 20px;
}

.btn-large {
  padding: 15px 40px;
  font-size: 1.2em;
}

/* 控制面板 */
.control-panel {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.control-panel h2 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 1.2em;
}

.host-controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.btn-primary, .btn-secondary, .btn-settlement {
  width: 100%;
  padding: 12px 20px;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1em;
  font-weight: bold;
  transition: all 0.3s;
}

.btn-primary {
  background: #2196f3;
}

.btn-primary:hover:not(:disabled) {
  background: #1976d2;
  transform: translateY(-2px);
}

.btn-secondary {
  background: #95a5a6;
}

.btn-secondary:hover:not(:disabled) {
  background: #7f8c8d;
}

.btn-settlement {
  background: #9c27b0;
}

.btn-settlement:hover:not(:disabled) {
  background: #7b1fa2;
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
}

/* 玩家出局操作样式 */
.eliminate-section {
  margin-top: 15px;
  padding: 15px;
  background: #fff3f3;
  border: 2px solid #ffcdd2;
  border-radius: 8px;
}

.eliminate-label {
  display: block;
  font-weight: 600;
  color: #c62828;
  margin-bottom: 10px;
  font-size: 0.95em;
}

.eliminate-select {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid #e57373;
  border-radius: 6px;
  background: white;
  font-size: 0.95em;
  color: #333;
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 10px;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 35px;
}

.eliminate-select:hover {
  border-color: #e53935;
  box-shadow: 0 2px 4px rgba(229, 57, 53, 0.2);
}

.eliminate-select:focus {
  outline: none;
  border-color: #e53935;
  box-shadow: 0 0 0 3px rgba(229, 57, 53, 0.1);
}

.eliminate-select option {
  padding: 8px;
  color: #333;
}

.eliminate-section .btn-eliminate {
  width: 100%;
  padding: 10px 20px;
  background: linear-gradient(135deg, #e53935 0%, #c62828 100%);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.95em;
  font-weight: 600;
  transition: all 0.3s;
  box-shadow: 0 2px 4px rgba(229, 57, 53, 0.3);
}

.eliminate-section .btn-eliminate:hover:not(:disabled) {
  background: linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(229, 57, 53, 0.4);
}

.eliminate-section .btn-eliminate:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(229, 57, 53, 0.3);
}

.eliminate-section .btn-eliminate:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.assassin-controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.btn-assassin {
  padding: 12px 20px;
  background: #ff5722;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1em;
  font-weight: bold;
  transition: all 0.3s;
}

.btn-assassin:hover {
  background: #e64a19;
}

.btn-assassin.active {
  background: #ff9800;
  box-shadow: 0 0 15px rgba(255, 152, 0, 0.5);
  animation: activePulse 2s infinite;
}

@keyframes activePulse {
  0%, 100% {
    box-shadow: 0 0 15px rgba(255, 152, 0, 0.5);
  }
  50% {
    box-shadow: 0 0 25px rgba(255, 152, 0, 0.8);
  }
}

.hint {
  color: #999;
  font-size: 0.85em;
  text-align: center;
  margin: 0;
}

.identity-selection {
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.identity-selection h3 {
  margin: 0 0 10px 0;
  color: #555;
  font-size: 1em;
}

.identity-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 10px;
}

.btn-identity {
  padding: 10px;
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1em;
  font-weight: bold;
  transition: all 0.3s;
}

.btn-identity:hover {
  border-color: #42b983;
  transform: translateY(-2px);
}

.btn-identity.assassin {
  border-color: #ff5722;
  color: #ff5722;
}

.btn-identity.assassin:hover {
  background: #ff5722;
  color: white;
}

/* 游戏结果 */
.result-section {
  background: linear-gradient(135deg, #fff9e6 0%, #ffe6e6 100%);
  padding: 30px;
  border-radius: 12px;
  text-align: center;
}

.result-banner {
  margin-bottom: 30px;
}

.trophy {
  font-size: 5em;
  margin-bottom: 10px;
  animation: trophyRotate 2s ease-in-out;
}

@keyframes trophyRotate {
  0%, 100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-10deg);
  }
  75% {
    transform: rotate(10deg);
  }
}

.result-section h2 {
  margin: 0 0 15px 0;
  color: #856404;
}

.winner-text {
  font-size: 1.8em;
  font-weight: bold;
  color: #856404;
  margin-bottom: 15px;
}

.result-reason {
  font-size: 1.1em;
  color: #666;
  margin-bottom: 20px;
}

.result-stats {
  background: white;
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 20px;
  text-align: left;
}

.result-stats h3 {
  margin: 0 0 10px 0;
  color: #555;
}

.result-stats ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.result-stats li {
  padding: 8px 0;
  color: #666;
  border-bottom: 1px solid #eee;
}

.result-stats li:last-child {
  border-bottom: none;
}

/* 退出按钮 */
.btn-exit {
  position: fixed;
  bottom: 30px;
  right: 30px;
  padding: 15px 30px;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  font-size: 1em;
  font-weight: bold;
  box-shadow: 0 4px 12px rgba(244, 67, 54, 0.4);
  transition: all 0.3s;
}

.btn-exit:hover {
  background: #d32f2f;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(244, 67, 54, 0.6);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .game-main {
    grid-template-columns: 1fr;
  }

  .right-panel {
    order: -1;
  }

  .elevator-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }
}

@media (max-width: 768px) {
  #game {
    padding: 10px;
  }

  .game-header {
    padding: 15px;
  }

  .game-header h1 {
    font-size: 1.5em;
  }

  .elevator-section, .players-section, .control-panel {
    padding: 15px;
  }

  .elevator-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 10px;
  }

  .floor-card {
    padding: 10px;
  }

  .floor-number {
    font-size: 1.2em;
  }

  .card-content {
    min-height: 60px;
  }

  .btn-exit {
    bottom: 15px;
    right: 15px;
    padding: 12px 24px;
  }
}

/* 玩家头像样式 */
.game-header .player-avatar {
  font-size: 2.2em;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 2px solid #42b983;
  background-color: #fff;
  overflow: hidden;
  text-align: center;
  margin-right: 12px;
}

/* 身份徽章样式 */
.player-identity-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.85em;
  font-weight: 600;
  margin-left: 8px;
  background-color: #42b983;
  color: #fff;
  display: inline-block;
}

/* 游戏头部玩家信息布局 */
.game-header .player-info {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
}

.game-header .player-name {
  display: inline-block;
  white-space: nowrap;
  margin-right: 8px;
}

/* 玩家列表样式 */
.players-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.player-item {
  display: flex;
  align-items: center;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #dee2e6;
}

.player-item .player-avatar {
  font-size: 1.8em;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid #42b983;
  background-color: #fff;
  overflow: hidden;
  text-align: center;
  margin-right: 12px;
  flex-shrink: 0;
}

.player-item .player-name {
  flex: 1;
  font-weight: 500;
  color: #333;
}

.player-item .player-status {
  font-size: 1.2em;
  color: #666;
}

/* 出局玩家样式 */
.player-item.out {
  opacity: 0.5;
  background-color: #e9ecef;
}

.player-item.out .player-name {
  text-decoration: line-through;
  color: #999;
}

/* 序号显示样式 */
.player-sequence {
  font-weight: bold;
  color: #42b983;
  margin-right: 6px;
}

/* 未准备文字样式 */
.player-status.not-ready {
  color: #dc3545;
  font-weight: 500;
}

/* 身份和序号选择样式 */
.identity-selection {
  background-color: #f8f9fa;
  padding: 20px;
  border-radius: 10px;
  border: 1px solid #dee2e6;
}

.sequence-selection,
.identity-selection-area {
  margin-bottom: 20px;
}

.label {
  display: block;
  font-weight: 500;
  margin-bottom: 10px;
  color: #333;
}

.sequence-buttons,
.identity-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.btn-sequence {
  padding: 12px 24px;
  border: 2px solid #42b983;
  background-color: #fff;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1.1em;
  transition: all 0.3s;
}

.btn-sequence:hover:not(:disabled) {
  background-color: #42b983;
  color: #fff;
}

.btn-sequence.selected {
  background-color: #42b983;
  color: #fff;
}

.btn-sequence:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background-color: #e9ecef;
}

.identity-buttons .btn-identity {
  flex: 1;
  min-width: 120px;
}

.btn-identity {
  padding: 12px 24px;
  border: 2px solid #6c757d;
  background-color: #fff;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s;
}

.btn-identity:hover {
  background-color: #6c757d;
  color: #fff;
}

.btn-identity.selected {
  background-color: #42b983;
  border-color: #42b983;
  color: #fff;
}

.btn-identity.assassin.selected {
  background-color: #dc3545;
  border-color: #dc3545;
}

.btn-ready {
  width: 100%;
  padding: 15px;
  background-color: #28a745;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 1.1em;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 10px;
}

.btn-ready:hover:not(:disabled) {
  background-color: #218838;
}

.btn-ready:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
