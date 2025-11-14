<template>
  <div id="game">
    <div class="game-container">
      <!-- 游戏头部 -->
      <PiZheXianZhiHeader
        :room-id="roomId"
        :current-player="currentPlayer"
        @copy-room-id="copyRoomId"
      />

      <!-- 主游戏区域 -->
      <div class="game-main">
        <!-- 左侧：电梯楼层和卡牌 -->
        <div class="left-panel">
          <!-- 电梯显示区 -->
          <PiZheXianZhiBoard
            :scenario-cards="scenarioCards"
            :is-assassin-viewing="isAssassinViewing"
            :is-all-floors-revealed="isAllFloorsRevealed"
            :is-current-player-assassin="isCurrentPlayerAssassin"
            :next-floor-to-reveal="nextFloorToReveal"
            @toggle-all-floors-reveal="toggleAllFloorsReveal"
            @show-card-effect="showCardEffect"
          />

          <!-- 卡牌效果弹窗 -->
          <PiZheXianZhiCardDetailModal
            :card="selectedCard"
            @close="closeModal"
          />
        </div>

        <!-- 右侧：玩家列表和控制面板 -->
        <div class="right-panel">
          <!-- 玩家列表 -->
          <PiZheXianZhiPlayerList
            :players="players"
            :my-player-id="myPlayerId"
          />

          <!-- 身份和序号选择（所有玩家可见，游戏进行中但未选择身份时显示） -->
          <PiZheXianZhiIdentitySelection
            v-if="roomData?.status === 'playing' && !currentPlayer?.identity"
            :players="players"
            :selected-sequence="selectedSequence"
            :selected-identity="selectedIdentity"
            :my-player-id="myPlayerId"
            @update:selected-sequence="selectedSequence = $event"
            @update:selected-identity="selectedIdentity = $event"
            @confirm-selection="confirmSelection"
          />

          <!-- 等待开始游戏状态 -->
          <PiZheXianZhiWaitingForGameStart
            v-if="roomData && roomData.status !== 'playing'"
            :can-reveal-cards="canRevealCards"
            :is-loading="isLoading"
            @start-game="initGame(1)"
          />

          <!-- 游戏控制面板（仅房主可见） -->
          <PiZheXianZhiHostControlPanel
            v-if="roomData?.status === 'playing' && canRevealCards"
            :players="players"
            :next-floor-to-reveal="nextFloorToReveal"
            :fart-cards-revealed-count="fartCardsRevealedCount"
            :is-loading="isLoading"
            :my-player-id="myPlayerId"
            @reveal-next-card="revealNextCard(myPlayerId)"
            @trigger-settlement="triggerSettlement(myPlayerId)"
            @eliminate-player="eliminateSelectedPlayer"
            @restart-game="initGame(1)"
          />

          <!-- 游戏结果 -->
          <PiZheXianZhiGameResult
            v-if="gameResult"
            :game-result="gameResult"
            @exit-game="exitGame"
          />
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

// 子组件
import PiZheXianZhiHeader from '../components/games/piZheXianZhi/PiZheXianZhiHeader.vue'
import PiZheXianZhiBoard from '../components/games/piZheXianZhi/PiZheXianZhiBoard.vue'
import PiZheXianZhiCardDetailModal from '../components/games/piZheXianZhi/PiZheXianZhiCardDetailModal.vue'
import PiZheXianZhiPlayerList from '../components/games/piZheXianZhi/PiZheXianZhiPlayerList.vue'
import PiZheXianZhiIdentitySelection from '../components/games/piZheXianZhi/PiZheXianZhiIdentitySelection.vue'
import PiZheXianZhiHostControlPanel from '../components/games/piZheXianZhi/PiZheXianZhiHostControlPanel.vue'
import PiZheXianZhiGameResult from '../components/games/piZheXianZhi/PiZheXianZhiGameResult.vue'
import PiZheXianZhiWaitingForGameStart from '../components/games/piZheXianZhi/PiZheXianZhiWaitingForGameStart.vue'

export default {
  name: 'GameView',
  components: {
    PiZheXianZhiHeader,
    PiZheXianZhiBoard,
    PiZheXianZhiCardDetailModal,
    PiZheXianZhiPlayerList,
    PiZheXianZhiIdentitySelection,
    PiZheXianZhiHostControlPanel,
    PiZheXianZhiGameResult,
    PiZheXianZhiWaitingForGameStart
  },
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

    const getRoleText = (player) => {
      if (player.id === roomData.value?.hostId) return '👑 房主'
      if (player.identity === PLAYER_IDENTITY.ASSASSIN) return '💨 屁者'
      return '👤 乘客'
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
    const eliminateSelectedPlayer = async (playerId) => {
      if (!playerId) {
        alert('请选择要出局的玩家')
        return
      }

      const player = players.value.find(p => p.id === playerId)
      if (!player) {
        alert('玩家不存在')
        return
      }

      if (!confirm(`确定要让 ${player.name} 出局吗？`)) {
        return
      }

      try {
        await eliminatePlayer(myPlayerId.value, playerId)
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
      isAssassinViewing,
      isAllFloorsRevealed,
      selectedCard,
      selectedSequence,
      selectedIdentity,
      PLAYER_IDENTITY,
      getRoleText,
      copyRoomId,
      revealNextCard,
      triggerSettlement,
      eliminatePlayer,
      eliminateSelectedPlayer,
      initGame,
      toggleAssassinView,
      toggleAllFloorsReveal,
      confirmSelection,
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

.game-main {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}

.left-panel,
.right-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
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
}

@media (max-width: 768px) {
  #game {
    padding: 10px;
  }
}
</style>
