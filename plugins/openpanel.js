/**
 * OpenPanel Analytics — Client-side tracking (self-hosted)
 *
 * Package: @openpanel/web
 * API: https://openpanel.alcor.exchange/api
 *
 * Key methods:
 *   op.track(event, properties)    — track custom event
 *   op.identify({ profileId, ... })— identify user
 *   op.setGlobalProperties({...})  — props sent with every event
 *   op.clear()                     — clear user data
 *
 * Disabled in development.
 */
import { OpenPanel } from '@openpanel/web'

const op = new OpenPanel({
  apiUrl: 'https://openpanel.alcor.exchange/api',
  clientId: 'ecae05d0-df38-46ef-8a18-9de67e34cb99',
  trackScreenViews: true,
  trackOutgoingLinks: true,
  trackAttributes: true,
  disabled: process.env.NODE_ENV === 'development',
})

export { op }
