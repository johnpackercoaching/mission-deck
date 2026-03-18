export const FIREBASE_CONFIG = {
  projectId: 'mission-deck-app',
  appId: '1:99658899110:web:ea6c1dd38992669be2de67',
  storageBucket: 'mission-deck-app.firebasestorage.app',
  apiKey: 'AIzaSyAp7kqb4AJry_GkAXdZbMm_fjYogD3AMkg',
  authDomain: 'mission-deck-app.firebaseapp.com',
  messagingSenderId: '99658899110',
  databaseURL: 'https://mission-deck-app-default-rtdb.firebaseio.com',
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
