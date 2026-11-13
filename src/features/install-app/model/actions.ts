import { toast } from '@/shared/ui'

import { promptInstall, setHint } from './install-store'

export async function install() {
  if (await promptInstall()) toast('Приложение установлено')
}

export async function copyLink() {
  try {
    await navigator.clipboard.writeText(location.origin)
    toast('Ссылка скопирована — вставьте её в Safari')
  } catch {
    toast('Не удалось скопировать ссылку')
  }
}

export function hideForGood() {
  setHint('never')
  toast('Подсказка скрыта. Вернуть — в Профиле')
}
