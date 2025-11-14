<template>
  <section class="identity-selection-section">
    <h2>🎭 选择身份和序号</h2>
    <div class="identity-selection-content">
      <p class="selection-title">请选择你的序号和身份，选择后无法更改</p>

      <!-- 序号选择 -->
      <div class="sequence-selection-block">
        <label class="label">选择序号：</label>
        <div class="sequence-buttons">
          <button
            v-for="n in players.length"
            :key="n"
            class="btn-sequence"
            :class="{ 'selected': selectedSequence === n }"
            @click="$emit('update:selectedSequence', n)"
            :disabled="isSequenceTaken(n)"
          >
            {{ n }}号
          </button>
        </div>
      </div>

      <!-- 身份选择 -->
      <div class="identity-selection-block">
        <label class="label">选择身份：</label>
        <div class="identity-buttons">
          <button
            class="btn-identity"
            :class="{ 'selected': selectedIdentity === PLAYER_IDENTITY.PASSENGER }"
            @click="$emit('update:selectedIdentity', PLAYER_IDENTITY.PASSENGER)"
          >
            👤 乘客
          </button>
          <button
            class="btn-identity assassin"
            :class="{ 'selected': selectedIdentity === PLAYER_IDENTITY.ASSASSIN }"
            @click="$emit('update:selectedIdentity', PLAYER_IDENTITY.ASSASSIN)"
          >
            💨 屁者
          </button>
        </div>
      </div>

      <!-- 准备按钮 -->
      <button
        class="btn-ready"
        @click="$emit('confirm-selection')"
        :disabled="!selectedIdentity || !selectedSequence"
      >
        ✅ 确认选择
      </button>
    </div>
  </section>
</template>

<script>
import { PLAYER_IDENTITY } from '../../../config/games/piZheXianZhiDataModel'

export default {
  name: 'IdentitySelection',
  props: {
    players: {
      type: Array,
      required: true
    },
    selectedSequence: {
      type: Number,
      default: null
    },
    selectedIdentity: {
      type: String,
      default: null
    },
    myPlayerId: {
      type: String,
      required: true
    }
  },
  emits: ['update:selectedSequence', 'update:selectedIdentity', 'confirm-selection'],
  setup(props) {
    const isSequenceTaken = (sequence) => {
      return props.players.some(p => p.sequence === sequence && p.id !== props.myPlayerId)
    }

    return {
      PLAYER_IDENTITY,
      isSequenceTaken
    }
  }
}
</script>

<style scoped>
.identity-selection-section {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.identity-selection-section h2 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 1.2em;
}

.identity-selection-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.selection-title {
  text-align: center;
  color: #666;
  font-size: 0.95em;
  margin: 0;
  padding: 10px;
  background-color: #f0f9ff;
  border-radius: 6px;
  border-left: 4px solid #2196f3;
}

.sequence-selection-block,
.identity-selection-block {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.label {
  font-weight: 500;
  color: #333;
  font-size: 0.95em;
}

.sequence-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
  gap: 10px;
}

.identity-selection-block .identity-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.btn-sequence {
  padding: 12px 24px;
  border: 2px solid #42b983;
  background-color: #fff;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1.1em;
  transition: all 0.3s;
}

.btn-sequence:hover:not(:disabled) {
  background-color: #42b983;
  color: #fff;
}

.btn-sequence.selected {
  background-color: #42b983;
  color: #fff;
}

.btn-sequence:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background-color: #e9ecef;
}

.btn-identity {
  padding: 12px 20px;
  border: 2px solid #6c757d;
  background-color: #fff;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  font-size: 1.15em;
  transition: all 0.3s;
}

.btn-identity:hover {
  background-color: #6c757d;
  color: #fff;
}

.btn-identity.selected {
  background-color: #42b983;
  border-color: #42b983;
  color: #fff;
}

.btn-identity.assassin.selected {
  background-color: #dc3545;
  border-color: #dc3545;
}

.btn-ready {
  padding: 15px;
  background-color: #28a745;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 1.1em;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  margin-top: 10px;
}

.btn-ready:hover:not(:disabled) {
  background-color: #218838;
}

.btn-ready:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
