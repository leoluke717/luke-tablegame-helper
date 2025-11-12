import { createApp } from 'vue'

const App = {
  template: `
    <div style="padding: 40px; text-align: center; font-family: Arial;">
      <h1>🎲 Vue 3 正在运行！</h1>
      <p>这是一个简单的测试页面</p>
      <button @click="count++" style="padding: 10px 20px; font-size: 16px;">
        点击次数: {{ count }}
      </button>
    </div>
  `,
  data() {
    return {
      count: 0
    }
  }
}

createApp(App).mount('#app')