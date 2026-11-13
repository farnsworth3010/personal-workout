import { equipmentLabels, equipmentList, type Equipment } from '@/entities/exercise'

import { ALWAYS } from '../../config/settings-options'

export function EquipmentList({
  home,
  onChange,
}: {
  home: readonly Equipment[] | undefined
  onChange: (next: Equipment[]) => void
}) {
  const toggle = (item: Equipment, checked: boolean) => {
    if (!home) return

    onChange(equipmentList.filter((e) => e !== ALWAYS && (e === item ? checked : home.includes(e))))
  }

  return (
    <ul className="min-[900px]:grid min-[900px]:grid-cols-2 min-[900px]:gap-x-6">
      {equipmentList.map((item) => {
        const fixed = item === ALWAYS

        return (
          <li
            key={item}
            className="border-b border-border first:border-t min-[900px]:nth-2:border-t"
          >
            <label className="grid min-h-13 cursor-pointer grid-cols-[1fr_auto] items-center gap-3 py-1.5 has-disabled:cursor-default">
              <span>
                {equipmentLabels[item]}
                {fixed && (
                  <small className="block text-xs text-muted-foreground">всегда доступно</small>
                )}
              </span>
              {/* The invisible input sits over the box, so a click on the box hits the input itself. */}
              <span className="relative">
                <input
                  type="checkbox"
                  className="peer absolute inset-0 cursor-pointer opacity-0 disabled:cursor-default"
                  checked={fixed || (home?.includes(item) ?? false)}
                  disabled={fixed || !home}
                  onChange={(event) => toggle(item, event.target.checked)}
                />
                <i
                  aria-hidden="true"
                  className="grid size-[26px] place-items-center rounded-lg border-2 border-muted-foreground text-base font-extrabold text-transparent not-italic peer-checked:border-primary peer-checked:bg-primary peer-checked:text-on-accent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary peer-disabled:opacity-55"
                >
                  ✓
                </i>
              </span>
            </label>
          </li>
        )
      })}
    </ul>
  )
}
