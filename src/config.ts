export const FIREBASE_CONFIG = {
  projectId: 'autonomous-agent-hack',
  appId: '1:15535628185:web:f62001607f8baa1fddbd08',
  storageBucket: 'autonomous-agent-hack.firebasestorage.app',
  apiKey: 'AIzaSyDa-kX5jc84RnUFDcvBtUnnbX_7Bbh1IsI',
  authDomain: 'autonomous-agent-hack.firebaseapp.com',
  messagingSenderId: '15535628185',
  databaseURL: 'https://autonomous-agent-hack-default-rtdb.firebaseio.com',
} as const

export const RTDB_PREFIX = '/mission-deck' as const

export type AgentId =
  | 'project-resume-agent'
  | 'next-steps-agent'
  | 'product-manager-agent'
  | 'plan-builder-agent'
  | 'plan-validation-agent'
  | 'blocker-analysis-agent'
  | 'execution-agent'
  | 'playwright-test-agent'

export type AgentStatus = 'idle' | 'active' | 'complete' | 'error'

export interface AgentDef {
  id: AgentId
  name: string
  phase: string
}

export const AGENTS: AgentDef[] = [
  { id: 'project-resume-agent', name: 'Project Resume', phase: 'Orientation' },
  { id: 'next-steps-agent', name: 'Next Steps', phase: 'Direction' },
  { id: 'product-manager-agent', name: 'Product Manager', phase: 'Product Scoping' },
  { id: 'plan-builder-agent', name: 'Plan Builder', phase: 'Planning' },
  { id: 'plan-validation-agent', name: 'Plan Validation', phase: 'Validation' },
  { id: 'blocker-analysis-agent', name: 'Blocker Analysis', phase: 'Diagnostics' },
  { id: 'execution-agent', name: 'Execution', phase: 'Implementation' },
  { id: 'playwright-test-agent', name: 'Playwright Test', phase: 'Verification' },
] as const

export const MAX_TEAMS = 20
