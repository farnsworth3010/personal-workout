import { Maximize, Wifi, Zap, type LucideIcon } from 'lucide-react'

import type { InstallPlatform } from '../model/platform'

export const subs: Record<InstallPlatform, string> = {
  ios: 'В Safari это делается через меню «Поделиться» — займёт десять секунд.',
  'ios-other': 'На iPhone установить можно из Safari или из меню «Поделиться» вашего браузера.',
  android: 'Chrome установит приложение одним нажатием.',
  'android-menu': 'Кнопка установки сейчас недоступна — это делается через меню браузера.',
}

export const perks: [LucideIcon, string][] = [
  [Maximize, 'На весь экран, без панели браузера'],
  [Wifi, 'Тренировка идёт и без сети'],
  [Zap, 'Открывается с экрана «Домой»'],
]
