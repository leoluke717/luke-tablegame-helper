<template>
  <section class="result-section">
    <div class="result-banner">
      <div class="trophy">🏆</div>
      <h2>游戏结束</h2>
      <div class="winner-text">
        {{ winnerText }}
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

    <button class="btn-primary" @click="$emit('exit-game')">
      返回大厅
    </button>
  </section>
</template>

<script>
import { PLAYER_IDENTITY } from '../../../config/games/piZheXianZhiDataModel'

export default {
  name: 'GameResult',
  props: {
    gameResult: {
      type: Object,
      required: true
    }
  },
  emits: ['exit-game'],
  computed: {
    winnerText() {
      return this.gameResult.winner === PLAYER_IDENTITY.PASSENGER
        ? '👤 乘客阵营获胜'
        : '💨 屁者阵营获胜'
    }
  }
}
</script>

<style scoped>
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

.btn-primary {
  padding: 15px 40px;
  background: #2196f3;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.1em;
  font-weight: bold;
  transition: all 0.3s;
}

.btn-primary:hover {
  background: #1976d2;
  transform: translateY(-2px);
}
</style>
