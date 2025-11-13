<template>
  <div class="dynamic-config-renderer">
    <div v-for="(field, key) in schema" :key="key" class="config-field">
      <component
        :is="getControlComponent(field.type)"
        :field="field"
        v-model="modelValue[key]"
      />
    </div>
  </div>
</template>

<script>
import { defineComponent, computed } from 'vue'
import InputField from './FormControls/InputField.vue'
import SelectField from './FormControls/SelectField.vue'
import SwitchField from './FormControls/SwitchField.vue'
import SliderField from './FormControls/SliderField.vue'
import CheckboxField from './FormControls/CheckboxField.vue'
import { ControlTypes } from '../config/controls/schema'

export default defineComponent({
  name: 'DynamicConfigRenderer',
  components: {
    InputField,
    SelectField,
    SwitchField,
    SliderField,
    CheckboxField
  },
  props: {
    schema: {
      type: Object,
      required: true
    },
    modelValue: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const getControlComponent = (type) => {
      const componentMap = {
        [ControlTypes.INPUT]: 'InputField',
        [ControlTypes.NUMBER]: 'InputField',
        [ControlTypes.SELECT]: 'SelectField',
        [ControlTypes.SWITCH]: 'SwitchField',
        [ControlTypes.SLIDER]: 'SliderField',
        [ControlTypes.CHECKBOX]: 'CheckboxField',
        [ControlTypes.TEXTAREA]: 'InputField',
        [ControlTypes.RADIO]: 'SelectField'
      }
      return componentMap[type] || 'InputField'
    }

    return {
      getControlComponent,
      ControlTypes
    }
  }
})
</script>

<style scoped>
.dynamic-config-renderer {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.config-field {
  display: flex;
  flex-direction: column;
}
</style>
