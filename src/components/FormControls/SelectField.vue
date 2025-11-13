<template>
  <div class="select-field">
    <label v-if="field.label" class="field-label">
      {{ field.label }}
      <span v-if="field.required" class="required-mark">*</span>
    </label>
    <p v-if="field.description" class="field-description">
      {{ field.description }}
    </p>
    <select
      :value="modelValue"
      @change="$emit('update:modelValue', $event.target.value)"
      class="select-input"
      :class="{ error: hasError }"
    >
      <option
        v-for="option in field.options"
        :key="option.value"
        :value="option.value"
      >
        {{ option.label }}
      </option>
    </select>
    <span v-if="hasError" class="error-message">
      {{ errorMessage }}
    </span>
  </div>
</template>

<script>
import { defineComponent, computed } from 'vue'

export default defineComponent({
  name: 'SelectField',
  props: {
    field: {
      type: Object,
      required: true
    },
    modelValue: {
      type: [String, Number],
      default: ''
    }
  },
  emits: ['update:modelValue'],
  setup(props) {
    const hasError = computed(() => {
      // 基本验证：如果字段必填但值为空
      if (props.field.required && (props.modelValue === '' || props.modelValue === null || props.modelValue === undefined)) {
        return true
      }
      return false
    })

    const errorMessage = computed(() => {
      return hasError.value ? '此字段为必填项' : ''
    })

    return {
      hasError,
      errorMessage
    }
  }
})
</script>

<style scoped>
.select-field {
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
  margin-bottom: 8px;
  line-height: 1.4;
}

.select-input {
  padding: 12px 16px;
  font-size: 1em;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  outline: none;
  cursor: pointer;
  transition: all 0.2s;
  background-color: white;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 16px center;
  padding-right: 40px;
}

.select-input:focus {
  border-color: #42b983;
  box-shadow: 0 0 0 3px rgba(66, 185, 131, 0.1);
}

.select-input:hover {
  border-color: #c0c0c0;
}

.select-input.error {
  border-color: #e74c3c;
}

.error-message {
  color: #e74c3c;
  font-size: 0.9em;
  margin-top: 4px;
}
</style>
