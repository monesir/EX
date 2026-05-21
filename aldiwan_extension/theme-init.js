// This script runs at document_start to immediately apply the theme and prevent FOUC (Flash of Unstyled Content)
const savedTheme = localStorage.getItem('aldiwan_theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);
