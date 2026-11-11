import * as React from 'react'

import { Badge } from '../badge'
import { Button, buttonVariants } from '../button'
import { Chip } from '../chip'
import { ChipRow } from '../chip-row'
import { EmptyState } from '../empty-state'
import { HoldButton } from '../hold-button'
import { PageHeader } from '../page-header'
import { Sheet, SheetClose, SheetContent, SheetTrigger } from '../sheet'
import { Stat, StatRow } from '../stat-row'
import { Switch } from '../switch'
import { toast, Toaster } from '../toast'
import { ValueStrip } from '../value-strip'

const MUSCLES = ['Все', 'Грудь', 'Спина', 'Ноги', 'Плечи', 'Бицепс', 'Трицепс', 'Пресс']

// Every shared primitive in a few states, for visual review against the prototypes.
function UiDemo({ sheetOpen = false }: { sheetOpen?: boolean }) {
  const [muscle, setMuscle] = React.useState('Грудь')
  const [reps, setReps] = React.useState(10)
  const [weight, setWeight] = React.useState(61.25)
  const [homeOnly, setHomeOnly] = React.useState(true)

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-5 px-4 py-4 min-[900px]:px-10 min-[900px]:py-7">
      <PageHeader title="Упражнения" subtitle="873 упражнения · фото и техника" />

      <ChipRow aria-label="Мышцы">
        {MUSCLES.map((name) => (
          <Chip key={name} pressed={name === muscle} onPressedChange={() => setMuscle(name)}>
            {name}
          </Chip>
        ))}
      </ChipRow>

      <ValueStrip label="Повторы" value={reps} onChange={setReps} max={20} step={1} integer />

      {/* An off-grid value gets its own chip. */}
      <ValueStrip label="Вес, кг" value={weight} onChange={setWeight} max={100} step={2.5} />

      <label
        htmlFor="demo-home-only"
        className="flex min-h-16 items-center justify-between gap-4 border-y border-border py-2.5"
      >
        <span>
          <span className="block font-semibold">Только для дома</span>
          <span className="mt-0.5 block text-[13px] text-muted-foreground">
            Скрыть упражнения с тренажёрами
          </span>
        </span>
        <Switch id="demo-home-only" checked={homeOnly} onCheckedChange={setHomeOnly} />
      </label>

      <div className="flex items-center gap-3">
        <Switch aria-label="Выключен" />
        <Switch aria-label="Включён" defaultChecked />
        <Switch aria-label="Недоступен" disabled />
      </div>

      <StatRow>
        <Stat label="Подход" value="2 / 4" />
        <Stat label="План" value="10 × 60" />
        <Stat label="Время" value="01:42" />
      </StatRow>

      <p className="text-[15px] font-semibold">
        Жим штанги лёжа <Badge>Зал</Badge>
      </p>

      <EmptyState
        title="Ничего не найдено"
        description="Нет упражнений «жим» с гантелями. Проверьте написание или ослабьте фильтры."
      >
        <Button variant="outline" size="lg">
          Сбросить фильтры
        </Button>
      </EmptyState>

      <div className="flex flex-wrap gap-2">
        <Sheet defaultOpen={sheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline">Открыть описание</Button>
          </SheetTrigger>
          <SheetContent title="Жим штанги лёжа" description="Грудь · трицепс, плечи · штанга">
            <ol className="flex list-decimal flex-col gap-2 pl-5 text-[15px] leading-[1.4]">
              <li>Лягте на скамью так, чтобы глаза были под грифом.</li>
              <li>Возьмите гриф хватом чуть шире плеч, сведите лопатки.</li>
              <li>На вдохе опустите гриф к нижней части груди.</li>
            </ol>
          </SheetContent>
        </Sheet>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline">Отложенные</Button>
          </SheetTrigger>
          <SheetContent title="Отложенные упражнения" dismissible={false}>
            <p className="text-sm text-muted-foreground">Решите, что с ними сделать.</p>
            <SheetClose asChild>
              <Button variant="outline" size="lg">
                Завершить без них
              </Button>
            </SheetClose>
          </SheetContent>
        </Sheet>

        <HoldButton
          label="Завершить"
          className={buttonVariants({ variant: 'outline', size: 'lg' })}
          onConfirm={() => toast('Тренировка завершена')}
        />
        <HoldButton
          label="Недоступна"
          disabled
          className={buttonVariants({ variant: 'outline', size: 'lg' })}
          onConfirm={() => toast('Не должна сработать')}
        />

        <Button variant="outline" onClick={() => toast('Тренировка сохранена')}>
          Показать тост
        </Button>
      </div>

      <Toaster />
    </div>
  )
}

export { UiDemo }
