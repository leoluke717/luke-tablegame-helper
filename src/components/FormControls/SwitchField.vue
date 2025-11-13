<template>
  <div class="switch-field">
    <label v-if="field.label" class="field-label">
      {{ field.label }}
      <span v-if="field.required" class="required-mark">*</span>
    </label>
    <p v-if="field.description" class="field-description">
      {{ field.description }}
    </p>
    <label class="switch">
      <input
        type="checkbox"
        :checked="modelValue"
        @change="$emit('update:modelValue', $event.target.checked)"
      />
      <span class="switch-slider"></span>
    </label>
    <span v-if="hasError" class="error-message">
      {{ errorMessage }}
    </span>
  </div>
</template>

<script>
import { defineComponent, computed } from 'vue'

export default defineComponent({
  name: 'SwitchField',
  props: {
    field: {
      type: Object,
      required: true
    },
    modelValue: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue'],
  setup(props) {
    const hasError = computed(() => {
      // 开关类型一般不需要验证必填
      return false
    })

    const errorMessage = computed(() => {
      return hasError.value ? '配置验证失败' : ''
    })

    return {
      hasError,
      errorMessage
    }
  }
})
</script>

<style scoped>
.switch-field {
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

.switch {
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.switch-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.4s;
  border-radius: 34px;
}

.switch-slider:before {
  position: absolute;
  content: "";
  height: 26px;
  width: 26px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: 0.4s;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

input:checked + .switch-slider {
  background-color: #42b983;
}

input:checked + .switch-slider:before {
  transform: translateX(26px);
}

input:focus + .switch-slider {
  box-shadow: 0 0 0 3px rgba(66, 185, 131, 0.3);
}

.error-message {
  color: #e74c3c;
  font-size: 0.9em;
  margin-top: 4px;
}
</style>
