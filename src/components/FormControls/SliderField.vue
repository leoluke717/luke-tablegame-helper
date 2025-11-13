<template>
  <div class="slider-field">
    <label v-if="field.label" class="field-label">
      {{ field.label }}
      <span v-if="field.required" class="required-mark">*</span>
    </label>
    <p v-if="field.description" class="field-description">
      {{ field.description }}
    </p>
    <div class="slider-container">
      <input
        type="range"
        :min="field.min"
        :max="field.max"
        :step="field.step || 1"
        :value="modelValue"
        @input="$emit('update:modelValue', Number($event.target.value))"
        class="slider"
      />
      <div class="slider-values">
        <span class="min-value">{{ field.min }}{{ field.unit || '' }}</span>
        <span class="current-value">
          {{ modelValue }}{{ field.unit || '' }}
        </span>
        <span class="max-value">{{ field.max }}{{ field.unit || '' }}</span>
      </div>
    </div>
    <span v-if="hasError" class="error-message">
      {{ errorMessage }}
    </span>
  </div>
</template>

<script>
import { defineComponent, computed } from 'vue'

export default defineComponent({
  name: 'SliderField',
  props: {
    field: {
      type: Object,
      required: true
    },
    modelValue: {
      type: Number,
      default: 0
    }
  },
  emits: ['update:modelValue'],
  setup(props) {
    const hasError = computed(() => {
      if (props.field.required && (props.modelValue === null || props.modelValue === undefined)) {
        return true
      }
      return false
    })

    const errorMessage = computed(() => {
      return hasError.value ? '请设置滑块值' : ''
    })

    return {
      hasError,
      errorMessage
    }
  }
})
</script>

<style scoped>
.slider-field {
  display: flex;
  flex-direction: column;
  margin-bottom: 20px;
}

.field-label {
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
  font-size: 1.1em;
}

.required-mark {
  color: #e74c3c;
  margin-left: 4px;
}

.field-description {
  font-size: 0.9em;
  color: #666;
  margin-bottom: 12px;
  line-height: 1.4;
}

.slider-container {
  padding: 10px 0;
}

.slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: linear-gradient(to right, #e0e0e0 0%, #42b983 0%, #42b983 100%, #e0e0e0 100%);
  outline: none;
  -webkit-appearance: none;
  appearance: none;
  cursor: pointer;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #42b983;
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: all 0.2s;
}

.slider::-webkit-slider-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 8px rgba(66, 185, 131, 0.4);
}

.slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #42b983;
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: all 0.2s;
}

.slider::-moz-range-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 8px rgba(66, 185, 131, 0.4);
}

.slider::-moz-range-track {
  background: transparent;
  border: none;
}

.slider:focus {
  outline: none;
}

.slider:focus::-webkit-slider-thumb {
  box-shadow: 0 0 0 3px rgba(66, 185, 131, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2);
}

.slider::-moz-range-progress {
  background-color: #42b983;
  height: 6px;
  border-radius: 3px;
}

.slider-values {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 0.9em;
  color: #666;
}

.current-value {
  font-weight: bold;
  color: #42b983;
  font-size: 1.1em;
}

.error-message {
  color: #e74c3c;
  font-size: 0.9em;
  margin-top: 4px;
}
</style>
