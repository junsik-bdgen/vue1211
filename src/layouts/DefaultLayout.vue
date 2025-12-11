<script setup>
import NavBar from '../components/common/NavBar.vue'
import Footer from '../components/common/Footer.vue'

const getBackgroundUrl = () => {
  return new URL('../assets/tennis_court_background.png', import.meta.url).href
}
</script>

<template>
  <div class="app-layout" :style="{ backgroundImage: `url(${getBackgroundUrl()})` }">
    <header class="header">
      <NavBar />
    </header>
    
    <main class="main-content">
      <slot></slot>
    </main>

    <Footer />
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
}

.header {
  position: sticky;
  top: 0;
  z-index: 100;
}

.main-content {
  flex: 1;
  padding: 0.5rem;
  max-width: 1900 px;
  margin: 0 auto;
  width: 100%;
  background: rgba(255, 255, 255, 0.9);
  margin-top: 1rem;
  margin-bottom: 2rem;
  border-radius: 5px;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(5px);
}
</style>
