<template>
  <div style="padding: 40px; text-align: center;">
    <h1>🎲 Luke的桌游助手</h1>
    <p>简单测试页面</p>
    <button @click="testClick" style="padding: 10px 20px; margin-top: 20px;">
      测试按钮
    </button>
    <p v-if="clicked" style="color: green; margin-top: 20px;">
      按钮点击成功！
    </p>
  </div>
</template>

<script>
export default {
  name: 'SimpleHome',
  data() {
    return {
      clicked: false
    }
  },
  methods: {
    testClick() {
      this.clicked = true
    }
  }
}
</script>