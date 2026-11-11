import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { defaultProfile } from '@/entities/profile'

import { SettingsPage } from './settings-page'

const mocks = vi.hoisted(() => ({
  signOutUser: vi.fn(),
  useProfile: vi.fn(),
  update: vi.fn(),
  toast: vi.fn(),
  resetProgress: vi.fn(),
  discard: vi.fn(),
  workout: null as { template: { name: string } } | null,
}))
vi.mock('@/entities/workout', () => ({ resetProgress: mocks.resetProgress }))
vi.mock('@/entities/session', () => ({
  useSessionStore: Object.assign(
    (select: (s: { workout: typeof mocks.workout }) => unknown) =>
      select({ workout: mocks.workout }),
    { getState: () => ({ discard: mocks.discard }) },
  ),
}))
vi.mock('@/shared/api', () => ({ signOutUser: mocks.signOutUser }))
vi.mock('@/entities/profile', async (original) => ({
  ...(await original<typeof import('@/entities/profile')>()),
  useProfile: mocks.useProfile,
}))
vi.mock('@/shared/ui', async (original) => ({
  ...(await original<typeof import('@/shared/ui')>()),
  toast: mocks.toast,
}))

const user = { uid: 'u1', displayName: 'Алексей', email: 'a@example.com', photoURL: null }

const withEquipment = (homeEquipment: string[] | undefined) =>
  mocks.useProfile.mockReturnValue({
    profile: homeEquipment && { ...defaultProfile, homeEquipment },
    update: mocks.update,
  })

const box = (name: string) => screen.getByRole('checkbox', { name: new RegExp(`^${name}`) })

beforeEach(() => {
  vi.clearAllMocks()
})

describe('SettingsPage', () => {
  it("shows the account and the signed-in person's equipment", () => {
    withEquipment(['dumbbell', 'pull-up bar'])

    render(<SettingsPage user={user} />)

    expect(mocks.useProfile).toHaveBeenCalledWith('u1')
    expect(screen.getByText('Алексей')).toBeInTheDocument()
    expect(screen.getByText('a@example.com')).toBeInTheDocument()
    expect(box('Гантели')).toBeChecked()
    expect(box('Турник')).toBeChecked()
    expect(box('Штанга')).not.toBeChecked()
    expect(box('Собственный вес')).toBeChecked()
    expect(box('Собственный вес')).toBeDisabled()
  })

  it('saves the whole equipment list on each change', async () => {
    withEquipment(['pull-up bar'])
    render(<SettingsPage user={user} />)

    await userEvent.click(box('Гантели'))
    expect(mocks.update).toHaveBeenLastCalledWith({ homeEquipment: ['pull-up bar', 'dumbbell'] })

    await userEvent.click(box('Турник'))
    expect(mocks.update).toHaveBeenLastCalledWith({ homeEquipment: [] })
    expect(mocks.toast).not.toHaveBeenCalled()
  })

  it('locks the checklist until the profile arrives', () => {
    withEquipment(undefined)
    render(<SettingsPage user={user} />)

    expect(box('Гантели')).toBeDisabled()
  })

  it('shows and saves the workout defaults', async () => {
    mocks.useProfile.mockReturnValue({
      profile: {
        ...defaultProfile,
        homeEquipment: [],
        defaultRestSec: 90,
        defaultWeightStepKg: 2.5,
        sounds: true,
        animations: false,
      },
      update: mocks.update,
    })
    render(<SettingsPage user={user} />)

    const rest = screen.getByRole('group', { name: 'Отдых между подходами' })
    expect(within(rest).getByRole('button', { name: '1:30' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(within(rest).getByRole('button', { name: '0:15' })).toBeInTheDocument()
    expect(within(rest).getByRole('button', { name: '5:00' })).toBeInTheDocument()
    expect(within(rest).queryByRole('button', { name: '5:15' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '2,5 кг' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('switch', { name: /Звуки/ })).toBeChecked()
    expect(screen.getByRole('switch', { name: /Анимации/ })).not.toBeChecked()

    await userEvent.click(within(rest).getByRole('button', { name: '2:00' }))
    expect(mocks.update).toHaveBeenLastCalledWith({ defaultRestSec: 120 })

    await userEvent.click(screen.getByRole('button', { name: '5 кг' }))
    expect(mocks.update).toHaveBeenLastCalledWith({ defaultWeightStepKg: 5 })

    await userEvent.click(screen.getByRole('switch', { name: /Звуки/ }))
    expect(mocks.update).toHaveBeenLastCalledWith({ sounds: false })

    await userEvent.click(screen.getByRole('switch', { name: /Анимации/ }))
    expect(mocks.update).toHaveBeenLastCalledWith({ animations: true })
  })

  it('shows and saves each session timer on its own', async () => {
    mocks.useProfile.mockReturnValue({
      profile: { ...defaultProfile, timers: { exercise: true, rest: false, workout: true } },
      update: mocks.update,
    })
    render(<SettingsPage user={user} />)

    const timers = screen.getByRole('region', { name: 'Таймеры' })
    expect(within(timers).getByRole('switch', { name: /Время упражнения/ })).toBeChecked()
    expect(within(timers).getByRole('switch', { name: /^Отдых/ })).not.toBeChecked()

    await userEvent.click(within(timers).getByRole('switch', { name: /^Отдых/ }))
    expect(mocks.update).toHaveBeenLastCalledWith({ timers: { rest: true } })

    await userEvent.click(within(timers).getByRole('switch', { name: /Общее время/ }))
    expect(mocks.update).toHaveBeenLastCalledWith({ timers: { workout: false } })
  })

  it('locks the defaults until the profile arrives', () => {
    withEquipment(undefined)
    render(<SettingsPage user={user} />)

    expect(screen.getByRole('button', { name: '1 кг' })).toBeDisabled()
    expect(screen.getByRole('switch', { name: /Звуки/ })).toBeDisabled()
    expect(
      within(screen.getByRole('group', { name: 'Отдых между подходами' })).getByRole('button', {
        name: '1:30',
      }),
    ).toBeDisabled()
  })

  it('orders the blocks with the equipment and the reset last', () => {
    withEquipment([])
    render(<SettingsPage user={user} />)

    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      'Аккаунт',
      'По умолчанию',
      'Звуки и анимации',
      'Таймеры',
      'Моё оборудование дома',
      'Сброс прогресса',
    ])
    expect(
      within(screen.getByRole('group', { name: 'Шаг веса' }))
        .getAllByRole('button')
        .map((b) => b.textContent),
    ).toEqual(['0,5 кг', '1 кг', '2,5 кг', '5 кг'])
  })

  it('resets progress only after a ten-second hold, dropping the running session first', () => {
    vi.useFakeTimers()
    withEquipment([])
    render(<SettingsPage user={user} />)
    const reset = screen.getByRole('button', { name: 'Сбросить прогресс' })

    expect(reset).toHaveAccessibleDescription(/ваши наборы и расписание\. Настройки останутся/)

    fireEvent.click(reset)
    fireEvent.pointerDown(reset, { pointerType: 'mouse' })
    act(() => {
      vi.advanceTimersByTime(9_999)
    })
    expect(mocks.resetProgress).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(1)
    })
    vi.useRealTimers()

    expect(mocks.discard).toHaveBeenCalledOnce()
    expect(mocks.resetProgress).toHaveBeenCalledWith('u1')
    expect(mocks.discard.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.resetProgress.mock.invocationCallOrder[0] ?? 0,
    )
    expect(mocks.toast).toHaveBeenCalledWith('Прогресс сброшен')
  })

  it('signs out', async () => {
    withEquipment([])
    render(<SettingsPage user={user} />)

    await userEvent.click(screen.getByRole('button', { name: 'Выйти' }))

    expect(mocks.signOutUser).toHaveBeenCalledOnce()
  })

  it('asks before signing out over a workout that is not saved', async () => {
    withEquipment([])
    mocks.workout = { template: { name: 'Спина' } }
    render(<SettingsPage user={user} />)

    await userEvent.click(screen.getByRole('button', { name: 'Выйти' }))

    expect(mocks.signOutUser).not.toHaveBeenCalled()
    const dialog = screen.getByRole('dialog', { name: 'Выйти из аккаунта?' })
    expect(dialog).toHaveTextContent('«Спина» не сохранена')

    await userEvent.click(within(dialog).getByRole('button', { name: 'Выйти' }))

    expect(mocks.signOutUser).toHaveBeenCalledOnce()
    mocks.workout = null
  })
})
