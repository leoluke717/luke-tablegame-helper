<template>
  <div
    class="player-item"
    :class="{ 'out': player.status === 'out', 'me': isMe }"
    @click="handleClick"
  >
    <div class="player-avatar">{{ player.avatar || '😊' }}</div>
    <div class="player-name">
      <span class="player-sequence">({{ player.sequence || '?' }}号)</span>
      {{ player.name }}
    </div>
    <div class="player-status" v-if="player.status === 'out'">💀</div>
    <div class="player-status" v-else-if="!player.ready">未准备</div>
  </div>
</template>

<script>
export default {
  name: 'PiZheXianZhiPlayerItem',
  props: {
    player: {
      type: Object,
      required: true
    },
    isMe: {
      type: Boolean,
      default: false
    },
    clickable: {
      type: Boolean,
      default: false
    }
  },
  emits: ['click'],
  methods: {
    handleClick() {
      if (this.clickable) {
        this.$emit('click')
      }
    }
  }
}
</script>

<style scoped>
.player-item {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #dee2e6;
  transition: all 0.3s;
  cursor: default;
}

.player-item.clickable {
  cursor: pointer;
}

.player-item.clickable:hover {
  background: #fff8f8;
  border-color: #ffcdd2;
  box-shadow: 0 2px 8px rgba(229, 57, 53, 0.15);
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
  min-width: 30px;
  text-align: right;
}

.player-status.not-ready {
  color: #dc3545;
  font-weight: 500;
  font-size: 0.9em;
}

.player-status.ready {
  color: #28a745;
  font-weight: 600;
  font-size: 0.9em;
}

.player-sequence {
  font-weight: bold;
  color: #42b983;
  margin-right: 6px;
}
</style>
