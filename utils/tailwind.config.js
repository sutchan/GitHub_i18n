/**
 * Tailwind CSS 配置文件
 * 用于在生产环境中配置Tailwind CSS
 */
module.exports = {
  content: [
    '../index.html',
    './*.html',
    './*.js'
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4f46e5', // 升级为更现代的靛蓝色
        secondary: '#10b981',
        accent: '#6366f1',
        danger: '#ef4444',
        dark: '#1e293b',
        light: '#f8fafc',
        surface: '#ffffff',
        'surface-variant': '#f1f5f9',
        'primary-container': '#ede9fe'
      },
      fontFamily: {
        inter: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 4px 20px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 10px 25px rgba(0, 0, 0, 0.12)',
        'button': '0 2px 4px rgba(0, 0, 0, 0.1)'
      }
    },
  },
  plugins: [],
}