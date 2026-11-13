import { Gate } from '../gate'

export function AuthGate() {
  return <Gate allowed="signedIn" elsewhere="/login" />
}
