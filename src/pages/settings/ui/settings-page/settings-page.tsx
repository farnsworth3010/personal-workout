import { defaultProfile, useProfile } from '@/entities/profile'
import { InstallSettings } from '@/features/install-app'
import type { AuthUser } from '@/shared/api'
import { Loading, PageHeader } from '@/shared/ui'

import { timers, toggles } from '../../config/settings-options'
import { AccountSection } from '../account-section'
import { DefaultsSection } from '../defaults-section'
import { EquipmentSection } from '../equipment-section'
import { ResetSection } from '../reset-section'
import { SettingsSection } from '../settings-section'
import { SwitchList } from '../switch-list'

// settings.html.
export function SettingsPage({ user }: { user: AuthUser }) {
  const { profile, update } = useProfile(user.uid)
  const shown = profile ?? defaultProfile
  const loaded = profile !== undefined

  const content = (
    <>
      <DefaultsSection shown={shown} loaded={loaded} update={update} />

      <SettingsSection id="h-feedback" title="Звуки и анимации">
        <SwitchList
          idPrefix="toggle"
          items={toggles}
          loaded={loaded}
          checked={(key) => shown[key]}
          onChange={(key, checked) => update({ [key]: checked })}
        />
      </SettingsSection>

      <SettingsSection id="h-timers" title="Таймеры">
        <SwitchList
          idPrefix="timer"
          items={timers}
          loaded={loaded}
          checked={(key) => shown.timers[key]}
          onChange={(key, checked) => update({ timers: { [key]: checked } })}
        />
      </SettingsSection>
    </>
  )

  return (
    <>
      <PageHeader title="Профиль" />

      <div className="min-w-0 min-[900px]:grid min-[900px]:grid-cols-2 min-[900px]:items-start min-[900px]:gap-x-12">
        <div className="min-w-0">
          <AccountSection user={user} />
          <InstallSettings />
        </div>

        {/* Disables every control inside until the profile has loaded; role none keeps an unnamed group out of the tree. */}
        <fieldset
          role="none"
          disabled={!profile}
          className="mt-4 flex min-w-0 flex-col gap-4 min-[900px]:col-start-2 min-[900px]:row-span-3 min-[900px]:row-start-1 min-[900px]:mt-0"
        >
          {loaded ? content : <Loading className="contents">{content}</Loading>}
        </fieldset>

        <EquipmentSection
          home={profile?.homeEquipment}
          onChange={(homeEquipment) => update({ homeEquipment })}
        />

        {/* On desktop under the account, in the left column's free space, rather than below the fold. */}
        <ResetSection uid={user.uid} />
      </div>
    </>
  )
}
