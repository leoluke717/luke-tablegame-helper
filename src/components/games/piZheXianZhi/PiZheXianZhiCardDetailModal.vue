<template>
  <div v-if="card" class="modal-overlay" @click="$emit('close')">
    <div class="modal" @click.stop>
      <div class="modal-header">
        <h3>{{ card.cardName }}</h3>
        <button class="btn-close" @click="$emit('close')">×</button>
      </div>
      <div class="modal-body">
        <div class="effect-label">卡牌效果:</div>
        <div class="effect-text">{{ card.cardEffect }}</div>

        <div class="card-details">
          <div class="detail-item">
            <strong>楼层:</strong> {{ card.floor }}F
          </div>
          <div class="detail-item">
            <strong>类型:</strong> {{ card.hasFart ? '有屁牌' : '无屁牌' }}
          </div>
          <div class="detail-item">
            <strong>状态:</strong> {{ card.revealed ? '已揭示' : '未揭示' }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CardDetailModal',
  props: {
    card: {
      type: Object,
      default: null
    }
  },
  emits: ['close']
}
</script>

<style scoped>
/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  animation: modalSlideIn 0.3s ease;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-50px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 2px solid #eee;
}

.modal-header h3 {
  margin: 0;
  color: #333;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5em;
  cursor: pointer;
  color: #999;
  padding: 0;
  width: 30px;
  height: 30px;
}

.btn-close:hover {
  color: #666;
}

.modal-body {
  padding: 20px;
}

.effect-label {
  font-weight: bold;
  color: #555;
  margin-bottom: 10px;
}

.effect-text {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 8px;
  color: #333;
  line-height: 1.6;
  margin-bottom: 20px;
}

.card-details {
  display: grid;
  gap: 10px;
}

.detail-item {
  color: #666;
}
</style>
