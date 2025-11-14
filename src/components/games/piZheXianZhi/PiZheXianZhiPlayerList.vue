<template>
  <section class="players-section">
    <h2>👥 玩家 ({{ players.length }}人)</h2>
    <div class="players-list">
      <PiZheXianZhiPlayerItem
        v-for="player in sortedPlayers"
        :key="player.id"
        :player="player"
        :is-me="player.id === myPlayerId"
      />
      <div v-if="players.length === 0" class="players-empty">
        等待玩家加入...
      </div>
    </div>
  </section>
</template>

<script>
import PiZheXianZhiPlayerItem from './PiZheXianZhiPlayerItem.vue'

export default {
  name: 'PlayerList',
  components: {
    PiZheXianZhiPlayerItem
  },
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
</style>
