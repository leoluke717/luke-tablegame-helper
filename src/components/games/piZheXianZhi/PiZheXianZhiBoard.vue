<template>
  <section class="elevator-section">
    <div class="elevator-header">
      <h2>🏢 电梯楼层 ({{ sortedFloors.length }}张牌)</h2>
      <div class="header-buttons">
        <button
          v-if="skill.canUseSkill.value"
          class="btn-skill"
          :class="{ 'active': skill.skillModeActive.value }"
          @click="toggleSkillMode"
          :title="skill.skillModeActive.value ? '点击取消技能模式' : '点击启用技能模式'"
        >
          <span class="skill-icon">{{ skill.skillModeActive.value ? '⏹️' : '🔮' }}</span>
          <span class="skill-text">{{ skill.skillModeActive.value ? '取消技能' : '释放技能' }}</span>
        </button>
        <button
          v-if="isCurrentPlayerAssassin"
          class="btn-eye-small"
          :class="{ 'active': isAssassinViewing }"
          @click="$emit('toggle-assassin-view')"
          :title="isAssassinViewing ? '退出偷看模式' : '进入偷看模式'"
        >
          <span class="eye-icon">{{ isAssassinViewing ? '🙈' : '👁️' }}</span>
        </button>
      </div>
    </div>
    <div class="elevator-grid">
      <FloorCard
        v-for="floor in sortedFloors"
        :key="floor"
        :floor="floor"
        :card="getCard(floor)"
        :is-revealed="getCard(floor)?.revealed"
        :is-assassin-viewing="isAssassinViewing"
        :is-skill-viewing="skill.isFloorBeingViewed(floor)"
        :is-skill-mode-active="skill.skillModeActive.value"
        :is-current-floor="floor === nextFloorToReveal"
        :is-big-fart="isBigFartCard(floor)"
        @click-card="handleCardClick"
        @use-skill-on-floor="handleSkillUse"
      />
    </div>
  </section>
</template>

<script>
import { computed } from 'vue'
import FloorCard from './PiZheXianZhiFloorCard.vue'
import { CARD_EFFECTS } from '../../../config/games/piZheXianZhiCardEffects'
import { useSkill } from '../../../composables/useSkill'

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
    isCurrentPlayerAssassin: {
      type: Boolean,
      default: false
    },
    nextFloorToReveal: {
      type: Number,
      default: null
    },
    gameLogic: {
      type: Object,
      required: true
    },
    myPlayerId: {
      type: String,
      required: true
    },
    roomId: {
      type: String,
      required: true
    }
  },
  emits: ['show-card-effect', 'toggle-assassin-view'],
  setup(props, { emit }) {
    const skill = useSkill(props.gameLogic, props.myPlayerId, props.roomId)

    const sortedFloors = computed(() => {
      return Object.keys(props.scenarioCards)
        .map(Number)
        .sort((a, b) => a - b)
    })

    const getCard = (floor) => {
      return props.scenarioCards[floor]
    }

    const isBigFartCard = (floor) => {
      const card = getCard(floor)
      if (!card) return false
      const cardInfo = CARD_EFFECTS[card.cardType]
      return cardInfo?.isBigFart || false
    }

    const handleCardClick = (floor) => {
      // 如果技能模式激活，使用技能查看楼层
      if (skill.skillModeActive.value) {
        skill.useSkillOnFloor(floor)
        return
      }

      // 否则发送事件给父组件显示卡牌效果
      emit('show-card-effect', floor)
    }

    const handleSkillUse = (floor) => {
      skill.useSkillOnFloor(floor)
    }

    const toggleSkillMode = () => {
      if (skill.skillModeActive.value) {
        skill.exitSkillMode()
      } else {
        skill.activateSkillMode()
      }
    }

    return {
      skill,
      sortedFloors,
      getCard,
      isBigFartCard,
      handleCardClick,
      handleSkillUse,
      toggleSkillMode
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
}

.header-buttons {
  display: flex;
  gap: 8px;
}

.btn-skill {
  padding: 5px 10px;
  border: 2px solid #bdc3c7;
  background-color: #fff;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.85em;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 5px;
  color: #7f8c8d;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.btn-skill:hover {
  border-color: #8e44ad;
  background-color: #f8f9fa;
  color: #8e44ad;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(142, 68, 173, 0.2);
}

.btn-skill.active {
  background: linear-gradient(135deg, #8e44ad 0%, #9b59b6 100%);
  border-color: #8e44ad;
  color: #fff;
  box-shadow: 0 0 12px rgba(142, 68, 173, 0.4), 0 2px 8px rgba(0, 0, 0, 0.15);
  animation: skillActivePulse 2s infinite;
}

.btn-skill.active:hover {
  background: linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%);
  box-shadow: 0 0 15px rgba(142, 68, 173, 0.5), 0 2px 8px rgba(0, 0, 0, 0.2);
}

.skill-icon {
  font-size: 1em;
  display: flex;
  align-items: center;
}

.skill-text {
  font-size: 0.9em;
  letter-spacing: 0.5px;
}

@keyframes skillActivePulse {
  0%, 100% {
    box-shadow: 0 0 12px rgba(142, 68, 173, 0.4), 0 2px 8px rgba(0, 0, 0, 0.15);
  }
  50% {
    box-shadow: 0 0 18px rgba(142, 68, 173, 0.6), 0 2px 10px rgba(0, 0, 0, 0.2);
  }
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
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 15px;
  margin-top: 15px; /* 固定上边距，保持标题和楼层卡片的垂直间距恒定 */
}
</style>
