import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LobbyView from '../views/LobbyView.vue'
import GameView from '../views/GameView.vue'
import GameSettingsView from '../views/GameSettingsView.vue'
import IdentitySelectionTestView from '../views/IdentitySelectionTestView.vue'
import ScenarioCardsTestView from '../views/ScenarioCardsTestView.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/lobby/:roomId',
    name: 'lobby',
    component: LobbyView
  },
  {
    path: '/game/:roomId',
    name: 'game',
    component: GameView
  },
  {
    path: '/game-settings/:roomId',
    name: 'game-settings',
    component: GameSettingsView
  },
  {
    path: '/test/identity',
    name: 'test-identity',
    component: IdentitySelectionTestView
  },
  {
    path: '/test/cards',
    name: 'test-cards',
    component: ScenarioCardsTestView
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router