<template>
  <div id="home">
    <h1>🎲 Luke的桌游助手</h1>
    <p class="subtitle">多人桌游实时助手</p>

    <div class="actions">
      <button class="btn btn-primary" @click="createRoom">创建房间</button>
      <button class="btn btn-secondary" @click="showJoinDialog = true">加入房间</button>
    </div>

    <!-- 加入房间对话框 -->
    <div v-if="showJoinDialog" class="dialog-overlay" @click="showJoinDialog = false">
      <div class="dialog" @click.stop>
        <h2>加入房间</h2>
        <input
          v-model="joinRoomId"
          placeholder="请输入房间号"
          class="input"
          @keyup.enter="joinRoom"
        />
        <div class="dialog-actions">
          <button class="btn" @click="showJoinDialog = false">取消</button>
          <button class="btn btn-primary" @click="joinRoom" :disabled="!joinRoomId.trim()">
            加入
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

export default {
  name: 'HomeView',
  setup() {
    const router = useRouter()
    const showJoinDialog = ref(false)
    const joinRoomId = ref('')

    // 输入验证函数
    const validatePlayerName = (name) => {
      if (!name || name.trim().length === 0) {
        return '昵称不能为空'
      }
      if (name.trim().length < 2 || name.trim().length > 20) {
        return '昵称长度应在2-20个字符之间'
      }
      if (!/^[\w\u4e00-\u9fa5]+$/.test(name.trim())) {
        return '昵称只能包含字母、数字、下划线和中文'
      }
      return null
    }

    const validateRoomId = (roomId) => {
      if (!roomId || roomId.trim().length === 0) {
        return '房间号不能为空'
      }
      if (!/^[A-Z0-9-]+$/.test(roomId.trim())) {
        return '房间号只能包含大写字母、数字和连字符'
      }
      return null
    }

    const createRoom = () => {
      const playerName = prompt('请输入你的昵称：')
      if (!playerName) return

      const validationError = validatePlayerName(playerName)
      if (validationError) {
        alert(validationError)
        return
      }

      // 生成8位房间号（增加长度减少碰撞）
      const roomId = `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`

      // 清理旧的玩家ID
      localStorage.removeItem('playerId')
      localStorage.removeItem('isHost') // 不再存储房主标识

      // 将玩家信息存储到 localStorage
      localStorage.setItem('playerName', playerName.trim())
      localStorage.setItem('roomId', roomId)

      // 跳转到房间大厅
      router.push(`/lobby/${roomId}`)
    }

    const joinRoom = () => {
      const roomId = joinRoomId.value.trim().toUpperCase()

      const roomValidationError = validateRoomId(roomId)
      if (roomValidationError) {
        alert(roomValidationError)
        return
      }

      const playerName = prompt('请输入你的昵称：')
      if (!playerName) return

      const nameValidationError = validatePlayerName(playerName)
      if (nameValidationError) {
        alert(nameValidationError)
        return
      }

      // 清理旧的玩家ID
      localStorage.removeItem('playerId')
      localStorage.removeItem('isHost') // 不再存储房主标识

      // 将玩家信息存储到 localStorage
      localStorage.setItem('playerName', playerName.trim())
      localStorage.setItem('roomId', roomId)

      // 跳转到房间大厅
      router.push(`/lobby/${roomId}`)
    }

    return {
      showJoinDialog,
      joinRoomId,
      createRoom,
      joinRoom
    }
  }
}
</script>

<style scoped>
#home {
  max-width: 600px;
  margin: 0 auto;
  padding: 40px 20px;
  text-align: center;
}

h1 {
  color: #42b983;
  font-size: 2.5em;
  margin-bottom: 10px;
}

.subtitle {
  color: #666;
  font-size: 1.2em;
  margin-bottom: 40px;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.btn {
  padding: 15px 40px;
  font-size: 1.2em;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary {
  background-color: #42b983;
  color: white;
}

.btn-primary:hover {
  background-color: #359268;
}

.btn-secondary {
  background-color: #f0f0f0;
  color: #333;
}

.btn-secondary:hover {
  background-color: #e0e0e0;
}

.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.dialog {
  background: white;
  padding: 30px;
  border-radius: 12px;
  min-width: 400px;
}

.dialog h2 {
  margin-bottom: 20px;
  color: #333;
}

.input {
  width: 100%;
  padding: 12px;
  font-size: 1.1em;
  border: 2px solid #ddd;
  border-radius: 6px;
  margin-bottom: 20px;
  text-transform: uppercase;
}

.input:focus {
  outline: none;
  border-color: #42b983;
}

.dialog-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}
</style>