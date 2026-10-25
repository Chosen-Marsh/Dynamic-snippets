import { createApp } from 'vue';
import PopupApp from './PopupApp.vue';
import { i18n } from '../i18n/index.js';
import '../theme.css';

createApp(PopupApp).use(i18n).mount('#app');
