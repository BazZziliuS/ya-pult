import React from 'react'
import ReactDOM from 'react-dom/client'
import { HeroUIProvider } from '@heroui/react'
import App from './App'
import { I18nProvider } from './i18n/I18nContext'
import { SettingsProvider } from './settings/SettingsContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <I18nProvider>
      <SettingsProvider>
        <HeroUIProvider>
          <main className="dark text-foreground bg-background min-h-screen">
            <App />
          </main>
        </HeroUIProvider>
      </SettingsProvider>
    </I18nProvider>
  </React.StrictMode>
)
