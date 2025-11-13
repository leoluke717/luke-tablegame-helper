<template>
  <div class="input-field">
    <label v-if="field.label" class="field-label">
      {{ field.label }}
      <span v-if="field.required" class="required-mark">*</span>
    </label>
    <p v-if="field.description" class="field-description">
      {{ field.description }}
    </p>
    <input
      :type="inputType"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      class="input-element"
      :class="{ error: hasError }"
      :placeholder="field.placeholder || ''"
      :min="field.min"
      :max="field.max"
    />
    <span v-if="hasError" class="error-message">
      {{ errorMessage }}
    </span>
  </div>
</template>

<script>
import { defineComponent, computed } from 'vue'

export default defineComponent({
  name: 'InputField',
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
    const inputType = computed(() => {
      return props.field.type || 'text'
    })

    const hasError = computed(() => {
      if (props.field.required && (!props.modelValue || props.modelValue === '')) {
        return true
      }
      if (props.field.type === 'number') {
        const num = Number(props.modelValue)
        if (props.field.min !== undefined && num < props.field.min) return true
        if (props.field.max !== undefined && num > props.field.max) return true
      }
      return false
    })

    const errorMessage = computed(() => {
      if (hasError.value) {
        if (props.field.required && (!props.modelValue || props.modelValue === '')) {
          return '此字段为必填项'
        }
        if (props.field.type === 'number') {
          const num = Number(props.modelValue)
          if (props.field.min !== undefined && num < props.field.min) {
            return `值不能小于 ${props.field.min}`
          }
          if (props.field.max !== undefined && num > props.field.max) {
            return `值不能大于 ${props.field.max}`
          }
        }
        return '输入值无效'
      }
      return ''
    })

    return {
      inputType,
      hasError,
      errorMessage
    }
  }
})
</script>

<style scoped>
.input-field {
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

.input-element {
  padding: 12px 16px;
  font-size: 1em;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  outline: none;
  transition: all 0.2s;
  font-family: inherit;
}

.input-element:focus {
  border-color: #42b983;
  box-shadow: 0 0 0 3px rgba(66, 185, 131, 0.1);
}

.input-element:hover {
  border-color: #c0c0c0;
}

.input-element.error {
  border-color: #e74c3c;
}

.error-message {
  color: #e74c3c;
  font-size: 0.9em;
  margin-top: 4px;
}
</style>
