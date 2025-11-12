<template>
  <div id="app">
    <h1>{{ title }}</h1>
    <p>欢迎来到Luke的桌游助手！</p>
    <button @click="count++">点击计数: {{ count }}</button>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      title: 'Luke的桌游助手',
      count: 0
    }
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

h1 {
  color: #42b983;
}

button {
  font-size: 1.2em;
  padding: 10px 20px;
  margin-top: 20px;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

button:hover {
  background-color: #359268;
}
</style>
