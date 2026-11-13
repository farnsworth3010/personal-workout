import { Gate } from '../gate'

export function GuestGate() {
  return <Gate allowed="signedOut" elsewhere="/" />
}
