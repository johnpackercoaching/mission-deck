import type { TeamData } from '../schemas'
import {
  PROJECT_RESUME_AGENT_PROMPT,
  NEXT_STEPS_AGENT_PROMPT,
  PRODUCT_MANAGER_AGENT_PROMPT,
  PLAN_BUILDER_AGENT_PROMPT,
  PLAN_VALIDATION_AGENT_PROMPT,
  BLOCKER_ANALYSIS_AGENT_PROMPT,
  EXECUTION_AGENT_PROMPT,
  PLAYWRIGHT_TEST_AGENT_PROMPT,
} from './agent-prompts'

function buildSeedTeams(): Record<string, TeamData> {
  const now = Date.now()
  const min = 60_000

  return {
    t01: {
      name: 'Alpha Strike',
      project: {
        previewUrl: '',
        prompts: {
          mission: 'Build a real-time collaboration whiteboard with drawing, sticky notes, and live cursors.',
          approach: 'React Canvas API with WebSocket sync layer. Conflict-free replicated data types for concurrent edits.',
        },
      },
      terminal: {
        lines: {
          l01: { text: '[system] Session started — Alpha Strike workspace initialized', timestamp: now - 5 * min, type: 'system' },
          l02: { text: '$ npm create vite@latest collab-board -- --template react-ts', timestamp: now - 4 * min, type: 'stdout' },
          l03: { text: 'Scaffolding project in ./collab-board...', timestamp: now - 4 * min + 5000, type: 'stdout' },
          l04: { text: 'Done. Now run:', timestamp: now - 4 * min + 8000, type: 'stdout' },
          l05: { text: '$ cd collab-board && npm install', timestamp: now - 3 * min, type: 'stdout' },
          l06: { text: 'added 217 packages in 12s', timestamp: now - 3 * min + 12000, type: 'stdout' },
          l07: { text: '$ npm run dev', timestamp: now - 2 * min, type: 'stdout' },
          l08: { text: 'VITE v7.2.4  ready in 340ms', timestamp: now - 2 * min + 1000, type: 'stdout' },
          l09: { text: '  > Local:   http://localhost:3000/', timestamp: now - 2 * min + 1100, type: 'stdout' },
          l10: { text: '[system] Canvas rendering engine initialized', timestamp: now - 1 * min, type: 'system' },
          l11: { text: '[system] WebSocket connection pool ready', timestamp: now - 30000, type: 'system' },
        },
      },
      artifacts: {
        a01: { name: 'architecture.md', path: '/docs/architecture.md', type: 'markdown', createdAt: now - 4 * min },
        a02: { name: 'Canvas.tsx', path: '/src/components/Canvas.tsx', type: 'typescript', createdAt: now - 3 * min },
        a03: { name: 'useWebSocket.ts', path: '/src/hooks/useWebSocket.ts', type: 'typescript', createdAt: now - 2 * min },
        a04: { name: 'StickyNote.tsx', path: '/src/components/StickyNote.tsx', type: 'typescript', createdAt: now - 1 * min },
      },
      agents: {
        'project-resume-agent': { name: 'Project Resume', status: 'complete', systemPrompt: PROJECT_RESUME_AGENT_PROMPT, lastActivity: now - 5 * min },
        'next-steps-agent': { name: 'Next Steps', status: 'complete', systemPrompt: NEXT_STEPS_AGENT_PROMPT, lastActivity: now - 4 * min },
        'product-manager-agent': { name: 'Product Manager', status: 'complete', systemPrompt: PRODUCT_MANAGER_AGENT_PROMPT, lastActivity: now - 4 * min },
        'plan-builder-agent': { name: 'Plan Builder', status: 'complete', systemPrompt: PLAN_BUILDER_AGENT_PROMPT, lastActivity: now - 3 * min },
        'plan-validation-agent': { name: 'Plan Validation', status: 'complete', systemPrompt: PLAN_VALIDATION_AGENT_PROMPT, lastActivity: now - 3 * min },
        'blocker-analysis-agent': { name: 'Blocker Analysis', status: 'idle', systemPrompt: BLOCKER_ANALYSIS_AGENT_PROMPT, lastActivity: now - 3 * min },
        'execution-agent': { name: 'Execution', status: 'active', systemPrompt: EXECUTION_AGENT_PROMPT, lastActivity: now - 1 * min },
        'playwright-test-agent': { name: 'Playwright Test', status: 'idle', systemPrompt: PLAYWRIGHT_TEST_AGENT_PROMPT, lastActivity: now - 5 * min },
      },
    },

    t02: {
      name: 'Byte Force',
      project: {
        previewUrl: '',
        prompts: {
          mission: 'Create an AI-powered code review assistant that provides inline suggestions and security analysis.',
          approach: 'VS Code extension with OpenAI API integration. AST parsing for context-aware reviews.',
        },
      },
      terminal: {
        lines: {
          l01: { text: '[system] Session started — Byte Force workspace initialized', timestamp: now - 8 * min, type: 'system' },
          l02: { text: '$ yo code --extensionType=ts', timestamp: now - 7 * min, type: 'stdout' },
          l03: { text: 'Generating VS Code extension scaffold...', timestamp: now - 7 * min + 3000, type: 'stdout' },
          l04: { text: '$ npm install openai @types/vscode', timestamp: now - 6 * min, type: 'stdout' },
          l05: { text: 'added 42 packages in 4s', timestamp: now - 6 * min + 4000, type: 'stdout' },
          l06: { text: '$ npm run compile', timestamp: now - 5 * min, type: 'stdout' },
          l07: { text: 'Build completed successfully', timestamp: now - 5 * min + 2000, type: 'stdout' },
          l08: { text: '$ npm run test', timestamp: now - 4 * min, type: 'stdout' },
          l09: { text: 'Error: Cannot find module ./reviewEngine', timestamp: now - 4 * min + 1000, type: 'stderr' },
          l10: { text: '[system] Blocker detected — missing module, invoking diagnostics', timestamp: now - 3 * min, type: 'system' },
          l11: { text: '$ touch src/reviewEngine.ts', timestamp: now - 2 * min, type: 'stdout' },
          l12: { text: '[system] Blocker resolved — resuming execution', timestamp: now - 1 * min, type: 'system' },
        },
      },
      artifacts: {
        a01: { name: 'extension.ts', path: '/src/extension.ts', type: 'typescript', createdAt: now - 7 * min },
        a02: { name: 'reviewEngine.ts', path: '/src/reviewEngine.ts', type: 'typescript', createdAt: now - 2 * min },
        a03: { name: 'package.json', path: '/package.json', type: 'json', createdAt: now - 7 * min },
      },
      agents: {
        'project-resume-agent': { name: 'Project Resume', status: 'complete', systemPrompt: PROJECT_RESUME_AGENT_PROMPT, lastActivity: now - 8 * min },
        'next-steps-agent': { name: 'Next Steps', status: 'complete', systemPrompt: NEXT_STEPS_AGENT_PROMPT, lastActivity: now - 7 * min },
        'product-manager-agent': { name: 'Product Manager', status: 'complete', systemPrompt: PRODUCT_MANAGER_AGENT_PROMPT, lastActivity: now - 7 * min },
        'plan-builder-agent': { name: 'Plan Builder', status: 'complete', systemPrompt: PLAN_BUILDER_AGENT_PROMPT, lastActivity: now - 6 * min },
        'plan-validation-agent': { name: 'Plan Validation', status: 'complete', systemPrompt: PLAN_VALIDATION_AGENT_PROMPT, lastActivity: now - 6 * min },
        'blocker-analysis-agent': { name: 'Blocker Analysis', status: 'error', systemPrompt: BLOCKER_ANALYSIS_AGENT_PROMPT, lastActivity: now - 3 * min },
        'execution-agent': { name: 'Execution', status: 'active', systemPrompt: EXECUTION_AGENT_PROMPT, lastActivity: now - 2 * min },
        'playwright-test-agent': { name: 'Playwright Test', status: 'idle', systemPrompt: PLAYWRIGHT_TEST_AGENT_PROMPT, lastActivity: now - 8 * min },
      },
    },

    t03: {
      name: 'Circuit Breakers',
      project: {
        previewUrl: '',
        prompts: {
          mission: 'Build a smart home energy dashboard that visualizes consumption patterns and suggests optimizations.',
          approach: 'Next.js with D3.js charts. IoT data simulation for demo. Real-time streaming with Server-Sent Events.',
        },
      },
      terminal: {
        lines: {
          l01: { text: '[system] Session started — Circuit Breakers workspace initialized', timestamp: now - 12 * min, type: 'system' },
          l02: { text: '$ npx create-next-app@latest energy-dash --typescript --tailwind', timestamp: now - 11 * min, type: 'stdout' },
          l03: { text: 'Creating a new Next.js app...', timestamp: now - 11 * min + 2000, type: 'stdout' },
          l04: { text: '$ npm install d3 @types/d3', timestamp: now - 10 * min, type: 'stdout' },
          l05: { text: 'added 18 packages in 3s', timestamp: now - 10 * min + 3000, type: 'stdout' },
          l06: { text: '$ npm run dev', timestamp: now - 9 * min, type: 'stdout' },
          l07: { text: '  > Ready on http://localhost:3001', timestamp: now - 9 * min + 2000, type: 'stdout' },
          l08: { text: '[system] D3 chart rendering pipeline established', timestamp: now - 7 * min, type: 'system' },
          l09: { text: '[system] IoT data simulator generating sample readings', timestamp: now - 5 * min, type: 'system' },
          l10: { text: '[system] SSE endpoint /api/stream connected', timestamp: now - 3 * min, type: 'system' },
          l11: { text: '[system] All 4 dashboard panels rendering — verification complete', timestamp: now - 1 * min, type: 'system' },
        },
      },
      artifacts: {
        a01: { name: 'EnergyChart.tsx', path: '/src/components/EnergyChart.tsx', type: 'typescript', createdAt: now - 8 * min },
        a02: { name: 'ConsumptionGrid.tsx', path: '/src/components/ConsumptionGrid.tsx', type: 'typescript', createdAt: now - 6 * min },
        a03: { name: 'data-simulator.ts', path: '/src/lib/data-simulator.ts', type: 'typescript', createdAt: now - 5 * min },
        a04: { name: 'stream-api.ts', path: '/src/app/api/stream/route.ts', type: 'typescript', createdAt: now - 3 * min },
        a05: { name: 'OptimizationPanel.tsx', path: '/src/components/OptimizationPanel.tsx', type: 'typescript', createdAt: now - 2 * min },
      },
      agents: {
        'project-resume-agent': { name: 'Project Resume', status: 'complete', systemPrompt: PROJECT_RESUME_AGENT_PROMPT, lastActivity: now - 12 * min },
        'next-steps-agent': { name: 'Next Steps', status: 'complete', systemPrompt: NEXT_STEPS_AGENT_PROMPT, lastActivity: now - 11 * min },
        'product-manager-agent': { name: 'Product Manager', status: 'complete', systemPrompt: PRODUCT_MANAGER_AGENT_PROMPT, lastActivity: now - 11 * min },
        'plan-builder-agent': { name: 'Plan Builder', status: 'complete', systemPrompt: PLAN_BUILDER_AGENT_PROMPT, lastActivity: now - 10 * min },
        'plan-validation-agent': { name: 'Plan Validation', status: 'complete', systemPrompt: PLAN_VALIDATION_AGENT_PROMPT, lastActivity: now - 10 * min },
        'blocker-analysis-agent': { name: 'Blocker Analysis', status: 'idle', systemPrompt: BLOCKER_ANALYSIS_AGENT_PROMPT, lastActivity: now - 12 * min },
        'execution-agent': { name: 'Execution', status: 'complete', systemPrompt: EXECUTION_AGENT_PROMPT, lastActivity: now - 2 * min },
        'playwright-test-agent': { name: 'Playwright Test', status: 'complete', systemPrompt: PLAYWRIGHT_TEST_AGENT_PROMPT, lastActivity: now - 1 * min },
      },
    },
  }
}

export const SEED_TEAMS = buildSeedTeams
