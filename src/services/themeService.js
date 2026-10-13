const THEME_KEY = 'jey_avila_music_admin_theme'

export function getTheme() {
  return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light'
}

export function applyTheme(theme) {
  const isDark = theme === 'dark'
  document.documentElement.classList.toggle('dark', isDark)
  document.documentElement.style.colorScheme = isDark ? 'dark' : 'light'
}

export function setTheme(theme) {
  const next = theme === 'dark' ? 'dark' : 'light'
  localStorage.setItem(THEME_KEY, next)
  applyTheme(next)
  return next
}

export function applySavedTheme() {
  applyTheme(getTheme())
}
