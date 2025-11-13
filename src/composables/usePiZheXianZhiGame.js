/**
 * 屁者先知游戏逻辑 Hook
 * 处理所有Firebase数据操作和游戏状态管理
 */

import { ref, computed } from 'vue'
import { database } from '../firebase'
import { ref as dbRef, update, set, get, onValue, off } from 'firebase/database'
import {
  generateScenarioCards,
  revealCard,
  getNextFloorToReveal,
  getRevealedFartCardCount,
  areAllFartCardsRevealed,
  getCardByFloor
} from '../config/games/piZheXianZhiCardGenerator'
import { checkGameEnd } from '../config/games/piZheXianZhiIdentityLogic'
import { GAME_STATUS, PLAYER_IDENTITY } from '../config/games/piZheXianZhiDataModel'

/**
 * 初始化屁者先知游戏
 * @param {string} roomId - 房间ID
 * @returns {Object} 游戏逻辑对象
 */
export function usePiZheXianZhiGame(roomId) {
  // 状态管理
  const roomData = ref(null)
  const players = ref([])
  const scenarioCards = ref({})
  const gameResult = ref(null)
  const isLoading = ref(true)
  const error = ref(null)

  // Firebase 引用
  const roomRef = dbRef(database, `rooms/${roomId}`)
  const playersRef = dbRef(database, `rooms/${roomId}/players`)
  const cardsRef = dbRef(database, `rooms/${roomId}/scenarioCards`)
  const resultRef = dbRef(database, `rooms/${roomId}/gameResult`)

  // 监听器
  const unsubscribe = {
    room: null,
    players: null,
    cards: null,
    result: null
  }

  /**
   * 监听房间数据变化
   */
  const listenToRoom = () => {
    unsubscribe.room = onValue(roomRef, (snapshot) => {
      const data = snapshot.val()
      roomData.value = data || {}

      console.log('🏠 房间数据更新:', data)
    }, (err) => {
      console.error('❌ 房间数据监听失败:', err)
      error.value = '房间数据监听失败: ' + err.message
    })
  }

  /**
   * 监听玩家列表变化
   */
  const listenToPlayers = () => {
    unsubscribe.players = onValue(playersRef, (snapshot) => {
      const data = snapshot.val()
      players.value = data ? Object.values(data) : []

      console.log('👥 玩家数据更新:', players.value.length, '人')
    }, (err) => {
      console.error('❌ 玩家数据监听失败:', err)
      error.value = '玩家数据监听失败: ' + err.message
    })
  }

  /**
   * 监听场景牌变化
   */
  const listenToScenarioCards = () => {
    unsubscribe.cards = onValue(cardsRef, (snapshot) => {
      const data = snapshot.val()
      scenarioCards.value = data || {}

      console.log('🃏 场景牌数据更新:', Object.keys(scenarioCards.value).length, '张')
    }, (err) => {
      console.error('❌ 场景牌数据监听失败:', err)
      error.value = '场景牌数据监听失败: ' + err.message
    })
  }

  /**
   * 监听游戏结果变化
   */
  const listenToGameResult = () => {
    unsubscribe.result = onValue(resultRef, (snapshot) => {
      const data = snapshot.val()
      gameResult.value = data

      console.log('🏆 游戏结果更新:', data)
    }, (err) => {
      console.error('❌ 游戏结果监听失败:', err)
      error.value = '游戏结果监听失败: ' + err.message
    })
  }

  /**
   * 初始化游戏
   * 生成场景牌并设置初始状态
   */
  const initGame = async (bigFartCount = 1) => {
    try {
      isLoading.value = true
      error.value = null

      console.log('🎮 初始化游戏...')

      // 生成场景牌
      const cards = generateScenarioCards(bigFartCount)

      // 更新Firebase
      await update(roomRef, {
        gameType: 'piZheXianZhi',
        status: GAME_STATUS.PLAYING,
        currentFloor: 1,
        fartCardsRevealedCount: 0,
        'settings/bigFartCount': bigFartCount,
        'settings/smallFartCount': 4 - bigFartCount
      })

      // 保存场景牌
      await set(cardsRef, cards)

      console.log('✅ 游戏初始化完成')
    } catch (err) {
      console.error('❌ 游戏初始化失败:', err)
      error.value = '游戏初始化失败: ' + err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 揭示下一张场景牌（房主专用）
   */
  const revealNextCard = async (hostId) => {
    try {
      // 验证权限
      if (!hostId || hostId !== roomData.value?.hostId) {
        throw new Error('只有房主可以揭示场景牌')
      }

      // 检查游戏状态
      if (roomData.value?.status !== GAME_STATUS.PLAYING) {
        throw new Error('游戏未在进行中')
      }

      // 获取下一张要揭示的牌
      const nextFloor = getNextFloorToReveal(scenarioCards.value)
      if (nextFloor === null) {
        throw new Error('所有楼层都已揭示')
      }

      console.log(`📤 揭示 ${nextFloor}F 场景牌`)

      // 揭示卡牌
      revealCard(scenarioCards.value, nextFloor)

      // 更新到Firebase
      const card = getCardByFloor(scenarioCards.value, nextFloor)
      await update(dbRef(database, `rooms/${roomId}/scenarioCards/${nextFloor}`), {
        revealed: true,
        revealedAt: Date.now()
      })

      // 更新揭示计数
      const newCount = getRevealedFartCardCount(scenarioCards.value)
      await update(roomRef, {
        currentFloor: nextFloor + 1,
        fartCardsRevealedCount: newCount
      })

      console.log(`✅ ${nextFloor}F 揭示成功: ${card.cardName}`)

      // 检查是否满足结算条件
      if (areAllFartCardsRevealed(scenarioCards.value, 4)) {
        console.log('🎯 所有有屁牌已揭示，可以进行终局结算')
      }

      return card
    } catch (err) {
      console.error('❌ 揭示场景牌失败:', err)
      error.value = '揭示失败: ' + err.message
      throw err
    }
  }

  /**
   * 玩家出局（房主专用）
   */
  const eliminatePlayer = async (hostId, playerId) => {
    try {
      // 验证权限
      if (!hostId || hostId !== roomData.value?.hostId) {
        throw new Error('只有房主可以让玩家出局')
      }

      // 验证玩家存在
      const player = players.value.find(p => p.id === playerId)
      if (!player) {
        throw new Error('玩家不存在')
      }

      if (player.status === 'out') {
        throw new Error('玩家已经出局')
      }

      console.log(`💀 让玩家出局: ${player.name} (${playerId})`)

      // 更新玩家状态为出局
      await update(dbRef(database, `rooms/${roomId}/players/${playerId}`), {
        status: 'out',
        eliminatedAt: Date.now()
      })

      console.log(`✅ ${player.name} 已出局`)

      // 检查立即胜负条件（阵营全灭）
      const result = checkGameEnd(players.value, roomData.value?.fartCardsRevealedCount || 0)

      if (result) {
        await setGameResult(result)
        return result
      }

      return null
    } catch (err) {
      console.error('❌ 玩家出局操作失败:', err)
      error.value = '操作失败: ' + err.message
      throw err
    }
  }

  /**
   * 终局结算（房主专用）
   * 触发条件：所有4张有屁牌都已揭示
   */
  const triggerSettlement = async (hostId) => {
    try {
      // 验证权限
      if (!hostId || hostId !== roomData.value?.hostId) {
        throw new Error('只有房主可以进行终局结算')
      }

      // 检查是否所有有屁牌都已揭示
      const fartCount = roomData.value?.fartCardsRevealedCount || 0
      if (fartCount < 4) {
        throw new Error(`只有${fartCount}张有屁牌已揭示，还需要${4 - fartCount}张`)
      }

      console.log('🧮 执行终局结算...')

      // 执行胜负判定
      const result = checkGameEnd(players.value, 4)

      if (result) {
        await setGameResult(result)
        return result
      } else {
        throw new Error('不满足终局结算条件')
      }
    } catch (err) {
      console.error('❌ 终局结算失败:', err)
      error.value = '结算失败: ' + err.message
      throw err
    }
  }

  /**
   * 设置游戏结果
   */
  const setGameResult = async (result) => {
    try {
      const gameResultData = {
        winner: result.winner,
        reason: result.reason,
        revealedAt: result.revealedAt,
        condition: result.condition,
        statistics: {
          totalPlayers: players.value.length,
          passengersAlive: players.value.filter(p => p.status === 'alive' && p.identity === PLAYER_IDENTITY.PASSENGER).length,
          assassinsAlive: players.value.filter(p => p.status === 'alive' && p.identity === PLAYER_IDENTITY.ASSASSIN).length,
          fartCardsRevealed: roomData.value?.fartCardsRevealedCount || 0
        }
      }

      // 保存到Firebase
      await set(resultRef, gameResultData)

      // 更新房间状态为结束
      await update(roomRef, {
        status: GAME_STATUS.FINISHED
      })

      console.log('🏆 游戏结束:', gameResultData)
    } catch (err) {
      console.error('❌ 设置游戏结果失败:', err)
      throw err
    }
  }

  /**
   * 选择玩家身份（玩家操作）
   */
  const selectPlayerIdentity = async (playerId, identity) => {
    try {
      if (!playerId) {
        throw new Error('玩家ID不能为空')
      }

      if (identity !== PLAYER_IDENTITY.PASSENGER && identity !== PLAYER_IDENTITY.ASSASSIN) {
        throw new Error('无效的身份')
      }

      console.log(`🎭 玩家 ${playerId} 选择身份: ${identity}`)

      // 更新到Firebase
      await update(dbRef(database, `rooms/${roomId}/players/${playerId}`), {
        identity: identity,
        identitySelectedAt: Date.now()
      })

      console.log(`✅ 身份选择成功: ${identity}`)
    } catch (err) {
      console.error('❌ 身份选择失败:', err)
      error.value = '身份选择失败: ' + err.message
      throw err
    }
  }

  /**
   * 检查玩家是否为房主
   */
  const isHost = (playerId) => {
    return roomData.value?.hostId === playerId
  }

  /**
   * 检查玩家是否为屁者
   */
  const isAssassin = (playerId) => {
    const player = players.value.find(p => p.id === playerId)
    return player?.identity === PLAYER_IDENTITY.ASSASSIN
  }

  /**
   * 检查游戏是否结束
   */
  const isGameFinished = computed(() => {
    return roomData.value?.status === GAME_STATUS.FINISHED
  })

  /**
   * 检查所有有屁牌是否已揭示
   */
  const areAllFartCardsRevealedComputed = computed(() => {
    return (roomData.value?.fartCardsRevealedCount || 0) >= 4
  })

  /**
   * 清理监听器
   */
  const cleanup = () => {
    console.log('🧹 清理游戏监听器')
    if (unsubscribe.room) off(roomRef, 'value', unsubscribe.room)
    if (unsubscribe.players) off(playersRef, 'value', unsubscribe.players)
    if (unsubscribe.cards) off(cardsRef, 'value', unsubscribe.cards)
    if (unsubscribe.result) off(resultRef, 'value', unsubscribe.result)
  }

  // 初始化监听
  listenToRoom()
  listenToPlayers()
  listenToScenarioCards()
  listenToGameResult()

  return {
    // 状态
    roomData,
    players,
    scenarioCards,
    gameResult,
    isLoading,
    error,

    // 计算属性
    isGameFinished,
    areAllFartCardsRevealed: areAllFartCardsRevealedComputed,

    // 方法
    initGame,
    revealNextCard,
    eliminatePlayer,
    triggerSettlement,
    selectPlayerIdentity,
    isHost,
    isAssassin,
    setGameResult,
    cleanup
  }
}
