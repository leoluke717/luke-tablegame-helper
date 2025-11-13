<template>
  <div class="checkbox-field">
    <label v-if="field.label" class="field-label">
      {{ field.label }}
      <span v-if="field.required" class="required-mark">*</span>
    </label>
    <p v-if="field.description" class="field-description">
      {{ field.description }}
    </p>
    <div class="checkbox-list">
      <div
        v-for="option in field.options"
        :key="option.value"
        class="checkbox-item"
      >
        <label>
          <input
            type="checkbox"
            :value="option.value"
            :checked="modelValue && modelValue.includes(option.value)"
            @change="handleChange(option.value, $event.target.checked)"
          />
          <span class="checkmark"></span>
          {{ option.label }}
        </label>
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
  name: 'CheckboxField',
  props: {
    field: {
      type: Object,
      required: true
    },
    modelValue: {
      type: Array,
      default: () => []
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const hasError = computed(() => {
      if (props.field.required && (!props.modelValue || props.modelValue.length === 0)) {
        return true
      }
      return false
    })

    const errorMessage = computed(() => {
      return hasError.value ? '请至少选择一个选项' : ''
    })

    const handleChange = (value, checked) => {
      let newValue = [...props.modelValue]
      if (checked) {
        newValue.push(value)
      } else {
        newValue = newValue.filter(v => v !== value)
      }
      emit('update:modelValue', newValue)
    }

    return {
      hasError,
      errorMessage,
      handleChange
    }
  }
})
</script>

<style scoped>
.checkbox-field {
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

.checkbox-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.checkbox-item label {
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
}

.checkbox-item input[type="checkbox"] {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.checkmark {
  position: relative;
  height: 20px;
  width: 20px;
  background-color: white;
  border: 2px solid #e0e0e0;
  border-radius: 4px;
  margin-right: 12px;
  transition: all 0.2s;
}

.checkbox-item label:hover input ~ .checkmark {
  border-color: #42b983;
}

.checkbox-item label input:checked ~ .checkmark {
  background-color: #42b983;
  border-color: #42b983;
}

.checkmark:after {
  content: "";
  position: absolute;
  display: none;
}

.checkbox-item label input:checked ~ .checkmark:after {
  display: block;
}

.checkbox-item label .checkmark:after {
  left: 6px;
  top: 2px;
  width: 5px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.error-message {
  color: #e74c3c;
  font-size: 0.9em;
  margin-top: 4px;
}
</style>
