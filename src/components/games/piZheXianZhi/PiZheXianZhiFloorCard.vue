<template>
  <div
    class="floor-card"
    :class="{
      'revealed': isRevealed,
      'hidden': !isShow,
      'fart-card': card?.hasFart,
      'big-fart': isBigFart,
      'current-floor': isCurrentFloor,
      'skill-viewing': isSkillViewing,
      'assassin-viewing': isAssassinViewing,
      'skill-mode-active': isSkillModeActive && !isRevealed
    }"
    @click="handleClick"
  >
    <div class="floor-header">
      <div class="floor-number">{{ floor }}F</div>
      <div class="floor-status-badge" :class="badgeClass">
        {{ badgeText }}
      </div>
    </div>

    <!-- 卡牌内容 -->
    <div class="card-content">
      <div v-if="!isShow" class="hidden-content">
        ████
      </div>
      <div v-else class="revealed-content">
        <div class="card-name">{{ card?.cardName }}</div>
        <div v-if="isBigFart" class="big-fart-tip">
          💥 可点击查看
        </div>
        <div v-if="isSkillViewing" class="skill-viewing-tip">
          🔮 技能查看中
        </div>
      </div>
    </div>

    <!-- 当前楼层指示器 -->
    <div v-if="isCurrentFloor" class="pulse-indicator"></div>

    <!-- 技能模式提示 -->
    <div v-if="isSkillModeActive && !isRevealed" class="skill-tip">
      点击使用技能
    </div>
  </div>
</template>

<script>
export default {
  name: 'FloorCard',
  props: {
    floor: {
      type: Number,
      required: true
    },
    card: {
      type: Object,
      default: null
    },
    isRevealed: {
      type: Boolean,
      default: false
    },
    isAssassinViewing: {
      type: Boolean,
      default: false
    },
    isSkillViewing: {
      type: Boolean,
      default: false
    },
    isSkillModeActive: {
      type: Boolean,
      default: false
    },
    isCurrentFloor: {
      type: Boolean,
      default: false
    },
    isBigFart: {
      type: Boolean,
      default: false
    }
  },
  emits: ['click-card', 'use-skill-on-floor'],
  methods: {
    handleClick() {
      if (this.isSkillModeActive && !this.isRevealed) {
        this.$emit('use-skill-on-floor', this.floor)
      } else {
        this.$emit('click-card', this.floor)
      }
    }
  },
  computed: {
    isShow() {
      return this.isAssassinViewing || this.isRevealed || this.isSkillViewing
    },
    badgeClass() {
      if (!this.card) return ''

      if (!this.isShow) {
        return 'badge-hidden'
      }

      if (this.card.hasFart) {
        return this.card.cardType === '有屁' ? 'badge-small-fart' : 'badge-big-fart'
      }

      return 'badge-no-fart'
    },
    badgeText() {
      if (!this.card) return ''

      if (!this.isShow) {
        return '未揭示'
      }

      if (this.card.hasFart) {
        return this.card.cardType === '有屁' ? '小屁牌' : '大屁牌'
      }

      return '无屁牌'
    }
  }
}
</script>

<style scoped>
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

.floor-card.fart-card.assassin-viewing {
  background: linear-gradient(135deg, #fff5f5 0%, #ffe0e0 100%);
}

.floor-card.fart-card.skill-viewing {
  background: linear-gradient(135deg, #fff5f5 0%, #ffe0e0 100%);
}

.floor-card.big-fart.revealed {
  border-color: #e74c3c;
  box-shadow: 0 0 15px rgba(231, 76, 60, 0.3);
}

.floor-card.big-fart.assassin-viewing {
  border-color: #e74c3c;
  box-shadow: 0 0 15px rgba(231, 76, 60, 0.3);
}

.floor-card.big-fart.skill-viewing {
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

/* 技能查看样式 */
.floor-card.skill-viewing {
  border-color: #8e44ad;
  box-shadow: 0 0 15px rgba(142, 68, 173, 0.4);
  animation: skillGlow 0.5s ease-in-out;
}

@keyframes skillGlow {
  0% {
    box-shadow: 0 0 5px rgba(142, 68, 173, 0.2);
  }
  50% {
    box-shadow: 0 0 25px rgba(142, 68, 173, 0.6);
  }
  100% {
    box-shadow: 0 0 15px rgba(142, 68, 173, 0.4);
  }
}

.skill-viewing-tip {
  color: #8e44ad;
  font-size: 0.8em;
  margin-top: 5px;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* 技能模式提示 */
.skill-tip {
  position: absolute;
  bottom: 5px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(142, 68, 173, 0.9);
  color: white;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.7em;
  white-space: nowrap;
  animation: skillTipPulse 1.5s infinite;
}

@keyframes skillTipPulse {
  0%, 100% {
    opacity: 1;
    transform: translateX(-50%) scale(1);
  }
  50% {
    opacity: 0.7;
    transform: translateX(-50%) scale(1.05);
  }
}

.floor-card.skill-mode-active:not(.skill-viewing):not(.revealed) {
  cursor: pointer;
  border-style: dashed;
  border-color: #8e44ad;
  background-color: rgba(142, 68, 173, 0.05);
  transition: all 0.3s;
}

.floor-card.skill-mode-active:not(.skill-viewing):not(.revealed):hover {
  background-color: rgba(142, 68, 173, 0.15);
  border-style: solid;
}
</style>
