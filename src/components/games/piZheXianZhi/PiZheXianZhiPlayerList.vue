<template>
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
</template>

<script>
export default {
  name: 'PlayerList',
  props: {
    players: {
      type: Array,
      required: true
    },
    myPlayerId: {
      type: String,
      required: true
    }
  },
  computed: {
    sortedPlayers() {
      return [...this.players].sort((a, b) => {
        // 未选择序号的玩家排到最后
        if (!a.sequence && b.sequence) return 1
        if (a.sequence && !b.sequence) return -1
        if (!a.sequence && !b.sequence) return 0
        return a.sequence - b.sequence
      })
    }
  }
}
</script>

<style scoped>
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

.players-empty {
  text-align: center;
  color: #999;
  padding: 40px;
}

.player-item {
  display: flex;
  align-items: center;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #dee2e6;
  transition: all 0.3s;
}

.player-item:hover {
  transform: translateX(5px);
}

.player-item.me {
  border-color: #42b983;
  background: #f0f9f4;
}

.player-item.out {
  opacity: 0.5;
  background-color: #e9ecef;
}

.player-item.out .player-name {
  text-decoration: line-through;
  color: #999;
}

.player-avatar {
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

.player-name {
  flex: 1;
  font-weight: 500;
  color: #333;
}

.player-status {
  font-size: 1.2em;
  color: #666;
}

.player-status.not-ready {
  color: #dc3545;
  font-weight: 500;
}

.player-sequence {
  font-weight: bold;
  color: #42b983;
  margin-right: 6px;
}
</style>
