<template>
  <div id="lobby">
    <div class="lobby-container">
      <!-- 房间信息头部 -->
      <div class="room-header">
        <h1>🏠 房间大厅</h1>
        <div class="room-info">
          <div class="room-id">
            房间号：<strong>{{ roomId }}</strong>
          </div>
          <button v-if="isHost" class="btn-copy" @click="copyRoomId">📋 复制</button>
        </div>
        <div class="player-name">
          <span class="player-avatar">{{ currentPlayer?.avatar || '😊' }}</span>
          你的昵称：<strong>{{ playerName }}</strong>
          <span v-if="isHost" class="host-badge">👑 房主</span>
          <button class="btn-change-avatar" @click="showAvatarPicker = !showAvatarPicker">🎨 换头像</button>
          <button class="btn-change-name" @click="showNameEditor = !showNameEditor">✏️ 改昵称</button>
        </div>

        <!-- 昵称编辑器 -->
        <div v-if="showNameEditor" class="name-editor">
          <h4>修改昵称</h4>
          <div class="name-input-container">
            <input
              v-model="newPlayerName"
              type="text"
              class="name-input"
              :placeholder="playerName"
              maxlength="10"
              @input="validateName"
              @keyup.enter="saveName"
            />
            <div class="validation-msg" :class="{ error: !isNameValid, success: isNameValid && newPlayerName.trim() }">
              {{ nameValidationMsg }}
            </div>
          </div>
          <div class="name-actions">
            <button class="btn-cancel-name" @click="cancelNameEdit">取消</button>
            <button
              class="btn-save-name"
              @click="saveName"
              :disabled="!isNameValid || !newPlayerName.trim() || newPlayerName.trim() === playerName"
            >
              保存
            </button>
          </div>
        </div>

        <!-- Emoji选择器 -->
        <div v-if="showAvatarPicker" class="avatar-picker">
          <h4>选择头像</h4>
          <div class="emoji-grid">
            <button
              v-for="emoji in AVATAR_EMOJIS"
              :key="emoji"
              class="emoji-button"
              @click="selectAvatar(emoji)"
              :class="{ selected: emoji === currentPlayer?.avatar }"
            >
              {{ emoji }}
            </button>
          </div>
          <button class="btn-close-picker" @click="showAvatarPicker = false">完成</button>
        </div>
      </div>

      <!-- 邀请区域（仅房主可见） -->
      <div v-if="isHost" class="invite-section">
        <h3>📱 邀请玩家</h3>
        <div class="qr-code-container">
          <canvas ref="qrCanvas" class="qr-canvas"></canvas>
        </div>
        <p class="hint">或分享房间号：{{ roomId }}</p>
      </div>

      <!-- 游戏选择区域 -->
      <div class="game-selection">
        <h3>🎯 当前游戏</h3>
        <div class="game-display">
          <span class="game-name">{{ displaySelectedGame }}</span>
        </div>
      </div>

      <!-- 玩家列表 -->
      <div class="players-section">
        <h3>👥 玩家列表 ({{ players.length }})</h3>
        <div class="players-list">
          <div v-for="player in players" :key="player.id" class="player-item">
            <div class="player-info">
              <span class="player-avatar">{{ player.avatar || '😊' }}</span>
              <span class="player-name">{{ player.name }}</span>
              <span v-if="player.id === hostId" class="host-indicator">👑</span>
            </div>
          </div>
          <div v-if="players.length === 0" class="empty-state">
            {{ isHost ? '等待玩家加入...' : '正在加入房间...' }}
          </div>
        </div>
      </div>

      <!-- 游戏控制按钮（仅房主可见） -->
      <div v-if="isHost" class="actions">
        <button
          class="btn btn-secondary btn-settings"
          @click="goToGameSettings"
        >
          ⚙️ 游戏设置
        </button>
        <button
          class="btn btn-primary btn-start"
          @click="startGame"
          :disabled="players.length < 2"
        >
          🎮 开始游戏
        </button>
        <div v-if="players.length < 2" class="hint">
          需要至少 2 名玩家才能开始游戏
        </div>
      </div>

      <!-- 玩家等待状态（仅玩家可见） -->
      <div v-else class="waiting-status">
        <p>⏳ 等待房主开始游戏...</p>
      </div>

      <!-- 退出按钮 -->
      <div class="exit-section">
        <button class="btn btn-exit" @click="exitLobby">🚪 退出房间</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { database } from '../firebase'
import { ref as dbRef, onValue, set, update, remove } from 'firebase/database'
import QRCode from 'qrcode'
import { gameRegistry } from '../config/games'

export default {
  name: 'LobbyView',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const roomId = route.params.roomId

    const playerName = ref('')
    const isHost = ref(false)
    const players = ref([])
    const qrCanvas = ref(null)
    const hostId = ref(null) // 房主的玩家ID
    const currentPlayerId = ref(null) // 当前玩家的ID
    const currentPlayer = ref(null) // 当前玩家的完整信息
    const showAvatarPicker = ref(false) // 显示/隐藏头像选择器
    const showNameEditor = ref(false) // 显示/隐藏昵称编辑器
    const newPlayerName = ref('') // 新昵称输入
    const isNameValid = ref(false) // 昵称是否有效
    const nameValidationMsg = ref('') // 验证消息
    const selectedGame = ref('piZheXianZhi') // 当前选择的游戏（默认"屁者先知"）
    const isInitialized = ref(false) // 玩家是否已初始化完成

    let playersRef = null
    let unsubscribe = null
    let roomRef = null // 房间信息引用

    // 生产环境调试控制
    const DEBUG = import.meta.env.MODE === 'development'
    const log = (...args) => {
      if (DEBUG) console.log(...args)
    }

    // 头像Emoji集合（精选常用且易区分的emoji）
    const AVATAR_EMOJIS = [
      // 动物系列
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🐣',
      // 表情系列
      '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '😘', '😗', '😙', '😚', '😋',
      // 人物系列
      '👦', '👧', '👨', '👩', '🧑', '👶', '👱‍♂️', '👱‍♀️', '👮‍♂️', '👮‍♀️', '👷‍♂️', '👷‍♀️', '💂‍♂️', '💂‍♀️', '🧙‍♂️', '🧙‍♀️',
      // 食物系列
      '🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍒', '🍑', '🥝', '🍍', '🥥', '🥑', '🍅', '🥕', '🌽', '🍔', '🍟', '🍕', '🍪',
      // 物品系列
      '💎', '🎀', '🎁', '🎈', '🎉', '🎊', '🎯', '🎮', '🎲', '🧩', '🎨', '🎭', '🎪', '🎵', '🎶', '⚽', '🏀', '🏈', '⚾', '🎾',
      // 自然系列
      '🌸', '🌹', '🌺', '🌻', '🌼', '🌷', '🌱', '🍀', '🍁', '🍂', '🍃', '⭐', '🌟', '✨', '⚡', '🔥', '💧', '🌈', '☀️', '🌙'
    ]

    // 获取随机头像emoji
    const getRandomAvatar = () => {
      const randomIndex = Math.floor(Math.random() * AVATAR_EMOJIS.length)
      return AVATAR_EMOJIS[randomIndex]
    }

    // 验证昵称
    const validateName = () => {
      const name = newPlayerName.value.trim()

      if (!name) {
        isNameValid.value = false
        nameValidationMsg.value = ''
        return false
      }

      // 长度检查：2-10个字符
      if (name.length < 2) {
        isNameValid.value = false
        nameValidationMsg.value = '昵称至少需要2个字符'
        return false
      }
      if (name.length > 10) {
        isNameValid.value = false
        nameValidationMsg.value = '昵称不能超过10个字符'
        return false
      }

      // 字符检查：支持中文、英文、数字、下划线
      const validPattern = /^[\u4e00-\u9fa5a-zA-Z0-9_]+$/
      if (!validPattern.test(name)) {
        isNameValid.value = false
        nameValidationMsg.value = '昵称只能包含中文、英文、数字和下划线'
        return false
      }

      isNameValid.value = true
      nameValidationMsg.value = '✓ 昵称可用'
      return true
    }

    // 生成或获取浏览器唯一ID（与HomeView.vue保持一致）
    const getBrowserId = () => {
      let browserId = localStorage.getItem('browserId')
      if (!browserId) {
        // 生成基于浏览器特性的唯一ID（更稳定的方案）
        // 只使用稳定且不易变化的特征
        const fingerprint = [
          navigator.userAgent,
          navigator.language,
          navigator.platform,
          Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown',
          // 避免使用屏幕分辨率和Canvas（容易变化）
          // new Date().getTimezoneOffset() 也不稳定
        ].join('|')

        // 使用FNV-1a哈希算法
        let hash = 2166136261
        for (let i = 0; i < fingerprint.length; i++) {
          hash ^= fingerprint.charCodeAt(i)
          hash = (hash * 16777619) >>> 0  // FNV-1a算法
        }

        // 生成稳定的浏览器ID（不使用时间戳）
        browserId = 'browser_' + hash.toString(16)
        localStorage.setItem('browserId', browserId)
        if (DEBUG) console.log('🆕 生成新的浏览器ID:', browserId, '特征:', fingerprint)
      }
      return browserId
    }

    // Firebase操作重试机制
    const retryOperation = async (operation, maxRetries = 3, delay = 1000) => {
      let lastError
      for (let i = 0; i < maxRetries; i++) {
        try {
          return await operation()
        } catch (error) {
          lastError = error
          if (DEBUG) console.warn(`Firebase操作失败，第${i + 1}次重试:`, error.message)
          if (i < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
          }
        }
      }
      throw lastError
    }

    // 检查是否为房主（通过比较玩家ID）
    const checkIsHost = () => {
      console.log('🔍 检查房主权限:', {
        currentPlayerId: currentPlayerId.value,
        hostId: hostId.value,
        playerName: playerName.value,
        roomId: roomId
      })

      const result = currentPlayerId.value && hostId.value && currentPlayerId.value === hostId.value
      isHost.value = result

      if (DEBUG) {
        console.log('✅ 房主权限检查结果:', result ? '✅ 是房主' : '❌ 不是房主')
      }
    }

    // 生成二维码
    const generateQRCode = async () => {
      if (!qrCanvas.value) {
        if (DEBUG) console.error('❌ Canvas 元素未准备好')
        return
      }

      if (!isHost.value) {
        if (DEBUG) console.log('⏭️ 非房主，不生成二维码')
        return
      }

      const joinUrl = `${window.location.origin}/?room=${roomId}`

      const options = {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }

      try {
        if (DEBUG) console.log('⏳ 生成二维码中...')
        await QRCode.toCanvas(qrCanvas.value, joinUrl, options)
        if (DEBUG) console.log('✅ 二维码生成成功')
      } catch (err) {
        if (DEBUG) console.error('❌ 二维码生成失败:', err)
        if (qrCanvas.value) {
          const ctx = qrCanvas.value.getContext('2d')
          ctx.fillStyle = '#ff0000'
          ctx.fillRect(0, 0, 200, 200)
          ctx.fillStyle = '#ffffff'
          ctx.font = 'bold 16px Arial'
          ctx.textAlign = 'center'
          ctx.fillText('ERROR', 100, 100)
          ctx.fillText('See Console', 100, 120)
        }
      }
    }

    // 复制房间号
    const copyRoomId = async () => {
      try {
        await navigator.clipboard.writeText(roomId)
        alert('房间号已复制到剪贴板！')
      } catch (err) {
        alert('复制失败，请手动复制')
      }
    }

    // 初始化玩家
    const initPlayer = async () => {
      // 从 localStorage 获取玩家信息
      playerName.value = localStorage.getItem('playerName') || ''
      let playerId = localStorage.getItem('playerId')

      if (!playerName.value) {
        alert('未找到玩家信息，返回首页')
        router.push('/')
        return
      }

      try {
        // 检查是否已存在该玩家（使用重试机制）
        const roomPlayersRef = dbRef(database, `rooms/${roomId}/players`)
        const existingPlayerSnapshot = await retryOperation(
          () => new Promise((resolve) => {
            const unsubscribeCheck = onValue(roomPlayersRef, (snapshot) => {
              unsubscribeCheck()
              resolve(snapshot)
            }, { onlyOnce: true })
          })
        )

        const existingData = existingPlayerSnapshot.val()

        // 向后兼容性检查：如果localStorage中的playerId是旧格式（非browser_开头），
        // 则使用浏览器ID重新生成，确保ID格式一致性
        if (playerId && !playerId.startsWith('browser_')) {
          if (DEBUG) console.log('🔄 检测到旧格式playerId，进行转换:', playerId)
          playerId = null // 清除旧ID，强制使用浏览器ID
        }

        // 检查现有玩家列表中是否已存在使用当前浏览器ID的玩家
        const browserId = getBrowserId()
        let existingPlayerWithBrowserId = null

        if (existingData) {
          for (const [id, player] of Object.entries(existingData)) {
            if (id === browserId) {
              existingPlayerWithBrowserId = player
              break
            }
          }
        }

        // 如果玩家ID存在且在玩家列表中，则重用
        if (playerId && existingData && existingData[playerId]) {
          const existingPlayer = existingData[playerId]
          currentPlayer.value = existingPlayer
          console.log('♻️ 重用现有玩家身份:', existingPlayer.name)
          // 确保localStorage中的玩家ID是最新的
          localStorage.setItem('playerId', playerId)
        } else if (existingPlayerWithBrowserId) {
          // 向后兼容：如果房间中已存在使用当前浏览器ID的玩家，重用该玩家
          currentPlayer.value = existingPlayerWithBrowserId
          console.log('♻️ 向后兼容：重用现有浏览器玩家身份:', existingPlayerWithBrowserId.name)
          // 更新localStorage为浏览器ID
          localStorage.setItem('playerId', browserId)
          playerId = browserId
        } else {
          // 创建新玩家
          // 使用浏览器ID而不是随机生成，确保与HomeView.vue一致
          playerId = browserId

          const newPlayer = {
            id: playerId,
            name: playerName.value,
            avatar: getRandomAvatar(), // 分配随机头像
            score: 0,
            joinedAt: Date.now()
          }

          currentPlayer.value = newPlayer
          console.log('✨ 创建新玩家:', newPlayer)

          // 写入 Firebase（使用重试机制）
          const newPlayerRef = dbRef(database, `rooms/${roomId}/players/${playerId}`)
          await retryOperation(() => set(newPlayerRef, newPlayer))

          // 保存玩家ID到 localStorage
          localStorage.setItem('playerId', playerId)
        }

        // 关键修复：提前设置 currentPlayerId，确保在注册监听器前已设置
        currentPlayerId.value = playerId
        console.log('✅ currentPlayerId 设置完成:', currentPlayerId.value)

        // 安全检查：确保 currentPlayer 已被正确设置
        if (!currentPlayer.value) {
          console.error('❌ 初始化失败：currentPlayer 仍未设置')
          throw new Error('玩家初始化失败，请重试')
        }

        // 监听玩家列表变化
        const unsubscribePlayers = onValue(roomPlayersRef, (snapshot) => {
          const data = snapshot.val()
          if (data) {
            // 为向后兼容，为没有avatar的玩家添加默认头像
            const playersArray = Object.values(data).sort((a, b) => a.joinedAt - b.joinedAt)
            players.value = playersArray.map(player => {
              if (!player.avatar) {
                // 如果没有avatar，使用默认值
                return { ...player, avatar: '😊' }
              }
              return player
            })
          } else {
            players.value = []
          }
        })

        // 监听房间信息（房主ID等）
        roomRef = dbRef(database, `rooms/${roomId}`)
        const unsubscribeRoom = onValue(roomRef, async (snapshot) => {
          const roomData = snapshot.val()

          console.log('🏠 房间监听器触发:', roomData ? '房间存在' : '房间不存在')

          if (roomData && roomData.hostId) {
            // 房间已存在，有房主
            hostId.value = roomData.hostId
            checkIsHost()

            // 只有在玩家初始化完成后，才更新游戏选择（避免初始化过程中的干扰）
            if (isInitialized.value && roomData.selectedGame && roomData.selectedGame !== selectedGame.value) {
              if (DEBUG) console.log('🔄 更新游戏选择:', roomData.selectedGame)
              selectedGame.value = roomData.selectedGame
            }
          } else if (roomData && !roomData.hostId) {
            // 房间存在但无房主（如数据未初始化），当前玩家成为房主
            if (!currentPlayerId.value) {
              console.error('❌ 房间初始化失败：currentPlayerId 尚未设置')
              return
            }

            console.log('✨ 房间无房主，当前玩家成为房主，ID:', currentPlayerId.value)

            // 立即更新本地状态
            hostId.value = currentPlayerId.value
            checkIsHost()

            try {
              await retryOperation(() => update(roomRef, {
                hostId: currentPlayerId.value,
                createdAt: Date.now(),
                gameStatus: 'waiting'
              }))
              console.log('✅ 房间房主设置成功，hostId:', currentPlayerId.value)
            } catch (error) {
              console.error('❌ 设置房主失败:', error)
              hostId.value = null
              checkIsHost()
            }
          } else if (!roomData) {
            // 房间不存在，创建房间并设置房主

            // 关键修复：确保 currentPlayerId 已设置
            if (!currentPlayerId.value) {
              console.error('❌ 房间创建失败：currentPlayerId 尚未设置')
              return
            }

            console.log('✨ 房间不存在，创建房间，房主ID:', currentPlayerId.value)

            // 立即更新本地状态，让用户立即看到房主标识
            hostId.value = currentPlayerId.value
            checkIsHost()

            try {
              await retryOperation(() => update(roomRef, {
                hostId: currentPlayerId.value,
                createdAt: Date.now(),
                gameStatus: 'waiting'
              }))
              console.log('✅ 房间创建成功，hostId:', currentPlayerId.value)
            } catch (error) {
              console.error('❌ 创建房间失败:', error)
              // 如果创建失败，重置房主状态
              hostId.value = null
              checkIsHost()
            }
          }
        })

        // 保存 unsubscribe 函数以便清理
        unsubscribe = () => {
          unsubscribePlayers()
          unsubscribeRoom()
        }

        // 标记为已初始化完成
        isInitialized.value = true
        if (DEBUG) console.log('✅ 玩家初始化完成')
      } catch (error) {
        if (DEBUG) console.error('初始化玩家失败:', error)

        // 根据错误类型提供更友好的错误信息
        let errorMessage = '连接服务器失败'
        if (error.message.includes('Cannot set properties')) {
          errorMessage = '玩家初始化失败，请刷新页面重试'
        } else if (error.message.includes('network') || error.message.includes('Network')) {
          errorMessage = '网络连接失败，请检查网络连接'
        } else {
          errorMessage = error.message || '未知错误'
        }

        alert(`连接服务器失败，请检查网络连接或联系房主。错误：${errorMessage}`)
        router.push('/')
      }
    }

    // 开始游戏
    const startGame = async () => {
      if (players.value.length < 2) {
        alert('需要至少 2 名玩家才能开始游戏')
        return
      }

      try {
        // 设置第一个玩家为当前回合（使用重试机制）
        await retryOperation(() => update(dbRef(database, `rooms/${roomId}`), {
          currentTurn: players.value[0].id,
          gameStatus: 'playing'
        }))

        // 跳转到游戏页面
        router.push(`/game/${roomId}`)
      } catch (error) {
        if (DEBUG) console.error('开始游戏失败:', error)
        alert('开始游戏失败：' + error.message)
      }
    }

    // 修改头像
    const changeAvatar = async (newAvatar) => {
      // 安全检查：确保玩家信息已正确初始化
      if (!currentPlayer.value) {
        console.error('❌ 头像更新失败：currentPlayer 未初始化')
        alert('❌ 头像更新失败：玩家信息未初始化，请刷新页面重试')
        return
      }
      if (!currentPlayerId.value) {
        console.error('❌ 头像更新失败：currentPlayerId 未设置')
        alert('❌ 头像更新失败：玩家ID未设置，请刷新页面重试')
        return
      }

      try {
        const updatedPlayer = {
          ...currentPlayer.value,
          avatar: newAvatar
        }
        currentPlayer.value = updatedPlayer

        // 更新 Firebase
        const playerRef = dbRef(database, `rooms/${roomId}/players/${currentPlayerId.value}`)
        await retryOperation(() => update(playerRef, { avatar: newAvatar }))

        console.log('✅ 头像更新成功:', newAvatar)
      } catch (error) {
        console.error('❌ 头像更新失败:', error)
        alert('❌ 头像更新失败：' + error.message)
      }
    }

    // 修改昵称
    const changePlayerName = async (newName) => {
      // 安全检查：确保玩家信息已正确初始化
      if (!currentPlayer.value) {
        console.error('❌ 昵称更新失败：currentPlayer 未初始化')
        alert('❌ 昵称更新失败：玩家信息未初始化，请刷新页面重试')
        return false
      }
      if (!currentPlayerId.value) {
        console.error('❌ 昵称更新失败：currentPlayerId 未设置')
        alert('❌ 昵称更新失败：玩家ID未设置，请刷新页面重试')
        return false
      }

      try {
        const trimmedName = newName.trim()
        const updatedPlayer = {
          ...currentPlayer.value,
          name: trimmedName
        }
        currentPlayer.value = updatedPlayer

        // 更新 Firebase
        const playerRef = dbRef(database, `rooms/${roomId}/players/${currentPlayerId.value}`)
        await retryOperation(() => update(playerRef, { name: trimmedName }))

        // 更新 localStorage
        localStorage.setItem('playerName', trimmedName)
        playerName.value = trimmedName

        console.log('✅ 昵称更新成功:', trimmedName)
        return true
      } catch (error) {
        console.error('❌ 昵称更新失败:', error)
        alert('❌ 昵称更新失败：' + error.message)
        return false
      }
    }

    // 选择头像
    const selectAvatar = async (emoji) => {
      await changeAvatar(emoji)
      showAvatarPicker.value = false
    }

    // 保存昵称
    const saveName = async () => {
      if (!validateName()) {
        alert('请输入有效的昵称')
        return
      }

      const name = newPlayerName.value.trim()
      if (name === playerName.value) {
        cancelNameEdit()
        return
      }

      const success = await changePlayerName(name)
      if (success) {
        showNameEditor.value = false
        newPlayerName.value = ''
        nameValidationMsg.value = ''
        isNameValid.value = false
        // 修改成功，无需提示
      }
    }

    // 取消昵称编辑
    const cancelNameEdit = () => {
      showNameEditor.value = false
      newPlayerName.value = ''
      nameValidationMsg.value = ''
      isNameValid.value = false
    }

    // 退出房间
    const exitLobby = async () => {
      if (confirm('确定要退出房间吗？')) {
        try {
          // 清理玩家数据（使用重试机制）
          const currentPlayer = players.value.find(p => p.name === playerName.value)
          if (currentPlayer) {
            const playerRef = dbRef(database, `rooms/${roomId}/players/${currentPlayer.id}`)
            await retryOperation(() => remove(playerRef))
          }

          // 清理 localStorage
          localStorage.removeItem('playerName')
          localStorage.removeItem('isHost')
          localStorage.removeItem('roomId')
          localStorage.removeItem('playerId')

          // 返回首页
          router.push('/')
        } catch (error) {
          if (DEBUG) console.error('退出房间失败:', error)
          alert('退出房间失败：' + error.message)
        }
      }
    }

    // 游戏显示名称计算属性
    const displaySelectedGame = computed(() => {
      return gameRegistry.getGameName(selectedGame.value)
    })

    // 跳转到游戏设置页面
    const goToGameSettings = () => {
      router.push(`/game-settings/${roomId}`)
    }

    // 监听房主权限变化，自动生成二维码
    watch(isHost, async (newValue) => {
      if (newValue) {
        // 等待 DOM 更新完成
        await nextTick()
        if (qrCanvas.value) {
          generateQRCode()
        }
      }
    })

    onMounted(async () => {
      await initPlayer()

      // 等待 DOM 更新
      await nextTick()

      // 等待 Canvas 准备就绪（最多重试 10 次，防止无限循环）
      let retryCount = 0
      const maxRetries = 10
      const waitForCanvas = async () => {
        // 只有房主才需要等待二维码
        if (isHost.value && !qrCanvas.value && retryCount < maxRetries) {
          retryCount++
          await nextTick() // 等待 DOM 更新
          setTimeout(waitForCanvas, 200)
        } else if (isHost.value && qrCanvas.value) {
          // Canvas 准备好且是房主，生成二维码
          generateQRCode()
        }
      }

      // 开始等待
      await waitForCanvas()
    })

    onUnmounted(() => {
      if (unsubscribe) {
        unsubscribe()
      }
    })

    return {
      roomId,
      playerName,
      isHost,
      players,
      hostId,
      currentPlayer,
      showAvatarPicker,
      showNameEditor,
      newPlayerName,
      isNameValid,
      nameValidationMsg,
      selectedGame,
      displaySelectedGame,
      qrCanvas,
      copyRoomId,
      startGame,
      exitLobby,
      goToGameSettings,
      changeAvatar,
      selectAvatar,
      validateName,
      saveName,
      cancelNameEdit,
      AVATAR_EMOJIS,
      isInitialized
    }
  }
}
</script>

<style scoped>
#lobby {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.lobby-container {
  max-width: 800px;
  margin: 0 auto;
  background: white;
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.room-header {
  text-align: center;
  margin-bottom: 30px;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 20px;
}

.room-header h1 {
  color: #333;
  margin-bottom: 20px;
}

.room-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 15px;
  font-size: 1.2em;
}

.room-id strong {
  color: #42b983;
  font-size: 1.3em;
  letter-spacing: 2px;
}

.btn-copy {
  padding: 8px 16px;
  background-color: #f0f0f0;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1em;
}

.btn-copy:hover {
  background-color: #e0e0e0;
}

.player-name {
  font-size: 1.1em;
  color: #666;
}

.host-badge {
  margin-left: 10px;
  padding: 4px 12px;
  background-color: #ffd700;
  border-radius: 12px;
  font-size: 0.9em;
}

.invite-section {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 30px;
  text-align: center;
}

.invite-section h3 {
  margin-bottom: 15px;
  color: #333;
}

.qr-code-container {
  display: flex;
  justify-content: center;
  margin: 20px 0;
}

.qr-canvas {
  width: 200px;
  height: 200px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 3px solid #42b983;
}

.hint {
  color: #999;
  font-size: 0.9em;
  margin-top: 10px;
}

/* 游戏选择区域样式 */
.game-selection {
  background: #e3f2fd;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 30px;
  text-align: center;
  border: 2px solid #90caf9;
}

.game-selection h3 {
  margin-bottom: 10px;
  color: #333;
}

.game-display {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
}

.game-name {
  font-size: 1.5em;
  font-weight: bold;
  color: #1976d2;
  padding: 8px 20px;
  background: white;
  border-radius: 20px;
  border: 2px solid #64b5f6;
}

.players-section h3 {
  color: #333;
  margin-bottom: 15px;
}

.players-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.player-item {
  padding: 15px 20px;
  background: #f8f9fa;
  border-radius: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.player-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.player-name {
  font-size: 1.1em;
  color: #333;
}

.host-indicator {
  font-size: 1.3em;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #999;
  font-style: italic;
}

.actions {
  margin-top: 30px;
  text-align: center;
}

.btn {
  padding: 15px 50px;
  font-size: 1.3em;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary {
  background-color: #42b983;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #359268;
}

.btn-primary:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #f0f0f0;
  color: #333;
  border: 2px solid #ddd;
}

.btn-secondary:hover {
  background-color: #e0e0e0;
  border-color: #ccc;
}

.actions .btn {
  margin: 5px;
}

.btn-start {
  margin-bottom: 10px;
}

.btn-settings {
  margin-right: 10px;
}

.waiting-status {
  margin-top: 30px;
  text-align: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 10px;
}

.waiting-status p {
  color: #666;
  font-size: 1.1em;
}

.exit-section {
  margin-top: 30px;
  text-align: center;
}

.btn-exit {
  padding: 10px 30px;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.btn-exit:hover {
  background-color: #c82333;
}

/* 头像样式 */
.player-avatar {
  font-size: 1.8em;
  line-height: 1;
  margin-right: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid #42b983;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
  /* 确保emoji在容器内居中 */
  overflow: hidden;
  text-align: center;
}

/* 当前玩家头像样式 */
.player-name .player-avatar {
  font-size: 2.2em;
  width: 50px;
  height: 50px;
  margin-right: 12px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .player-avatar {
    width: 34px;
    height: 34px;
    margin-right: 6px;
    font-size: 1.5em;
  }

  .player-name .player-avatar {
    width: 40px;
    height: 40px;
    margin-right: 10px;
    font-size: 1.8em;
  }

  /* emoji按钮在移动端优化 */
  .emoji-grid {
    grid-template-columns: repeat(auto-fill, minmax(42px, 1fr));
    gap: 6px;
    max-height: 250px;
  }

  .emoji-button {
    font-size: 1.6em;
    padding: 8px;
  }

  /* 昵称编辑器移动端适配 */
  .name-actions {
    flex-direction: column;
  }

  .btn-change-name {
    margin-left: 6px;
  }

  /* 游戏选择区域移动端适配 */
  .game-name {
    font-size: 1.3em;
    padding: 6px 16px;
  }

  .actions .btn {
    width: 100%;
    margin: 5px 0;
  }

  .btn-settings {
    margin-right: 0;
  }
}

.btn-change-avatar {
  margin-left: 15px;
  padding: 6px 12px;
  background-color: #e3f2fd;
  border: 1px solid #90caf9;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9em;
  color: #1976d2;
  transition: all 0.2s;
}

.btn-change-avatar:hover {
  background-color: #bbdefb;
  border-color: #64b5f6;
}

.btn-change-name {
  margin-left: 8px;
  padding: 6px 12px;
  background-color: #f3e5f5;
  border: 1px solid #ce93d8;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9em;
  color: #8e24aa;
  transition: all 0.2s;
}

.btn-change-name:hover {
  background-color: #e1bee7;
  border-color: #ba68c8;
}

/* 昵称编辑器样式 */
.name-editor {
  margin-top: 20px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
  border: 2px solid #42b983;
  animation: slideDown 0.3s ease;
}

.name-editor h4 {
  margin-bottom: 15px;
  color: #333;
  text-align: center;
}

.name-input-container {
  margin-bottom: 15px;
}

.name-input {
  width: 100%;
  padding: 12px 16px;
  font-size: 1.1em;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  outline: none;
  transition: all 0.2s;
  box-sizing: border-box;
}

.name-input:focus {
  border-color: #42b983;
  box-shadow: 0 0 0 3px rgba(66, 185, 131, 0.1);
}

.name-input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.validation-msg {
  margin-top: 8px;
  font-size: 0.9em;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;
}

.validation-msg.error {
  color: #d32f2f;
  background-color: #ffebee;
}

.validation-msg.success {
  color: #388e3c;
  background-color: #e8f5e9;
}

.name-actions {
  display: flex;
  gap: 10px;
}

.btn-cancel-name {
  flex: 1;
  padding: 12px;
  background-color: #f5f5f5;
  color: #666;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1em;
  font-weight: bold;
  transition: all 0.2s;
}

.btn-cancel-name:hover {
  background-color: #eeeeee;
}

.btn-save-name {
  flex: 1;
  padding: 12px;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1em;
  font-weight: bold;
  transition: all 0.2s;
}

.btn-save-name:hover:not(:disabled) {
  background-color: #359268;
}

.btn-save-name:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

/* Emoji选择器样式 */
.avatar-picker {
  margin-top: 20px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
  border: 2px solid #42b983;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.avatar-picker h4 {
  margin-bottom: 15px;
  color: #333;
  text-align: center;
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(50px, 1fr));
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 15px;
  padding: 10px;
  background: white;
  border-radius: 8px;
}

.emoji-button {
  font-size: 2em;
  padding: 10px;
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  line-height: 1;
}

.emoji-button:hover {
  transform: scale(1.1);
  border-color: #42b983;
  background: #f0fdf4;
}

.emoji-button.selected {
  border-color: #42b983;
  background: #e8f5e9;
  box-shadow: 0 0 0 3px rgba(66, 185, 131, 0.2);
}

.btn-close-picker {
  width: 100%;
  padding: 12px;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1em;
  font-weight: bold;
  transition: all 0.2s;
}

.btn-close-picker:hover {
  background-color: #359268;
}
</style>