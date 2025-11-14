<template>
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
      <FloorCard
        v-for="floor in sortedFloors"
        :key="floor"
        :floor="floor"
        :card="getCard(floor)"
        :is-revealed="getCard(floor)?.revealed || isAllFloorsRevealed"
        :is-assassin-viewing="isAssassinViewing"
        :is-all-floors-revealed="isAllFloorsRevealed"
        :is-current-floor="floor === nextFloorToReveal"
        :is-big-fart="isBigFartCard(floor)"
        @click-card="showCardEffect"
      />
    </div>
  </section>
</template>

<script>
import FloorCard from './PiZheXianZhiFloorCard.vue'
import { CARD_EFFECTS } from '../../../config/games/piZheXianZhiCardEffects'

export default {
  name: 'GameBoard',
  components: {
    FloorCard
  },
  props: {
    scenarioCards: {
      type: Object,
      required: true
    },
    isAssassinViewing: {
      type: Boolean,
      default: false
    },
    isAllFloorsRevealed: {
      type: Boolean,
      default: false
    },
    isCurrentPlayerAssassin: {
      type: Boolean,
      default: false
    },
    nextFloorToReveal: {
      type: Number,
      default: null
    }
  },
  emits: ['toggle-all-floors-reveal', 'show-card-effect'],
  computed: {
    sortedFloors() {
      return Object.keys(this.scenarioCards)
        .map(Number)
        .sort((a, b) => a - b)
    }
  },
  methods: {
    getCard(floor) {
      return this.scenarioCards[floor]
    },
    isBigFartCard(floor) {
      const card = this.getCard(floor)
      if (!card) return false
      const cardInfo = CARD_EFFECTS[card.cardType]
      return cardInfo?.isBigFart || false
    },
    toggleAllFloorsReveal() {
      this.$emit('toggle-all-floors-reveal')
    },
    showCardEffect(floor) {
      this.$emit('show-card-effect', floor)
    }
  }
}
</script>

<style scoped>
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

@keyframes activeEyePulse {
  0%, 100% {
    box-shadow: 0 0 10px rgba(255, 87, 34, 0.6);
  }
  50% {
    box-shadow: 0 0 20px rgba(255, 87, 34, 0.9);
  }
}

.elevator-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 15px;
}
</style>
