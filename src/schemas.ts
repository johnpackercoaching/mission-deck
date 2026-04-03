import { z } from 'zod'

export const TerminalLineSchema = z.object({
  text: z.string(),
  timestamp: z.number(),
  type: z.enum(['stdout', 'stderr', 'system']),
})

export const ArtifactSchema = z.object({
  name: z.string(),
  path: z.string(),
  type: z.string(),
  createdAt: z.number(),
})

export const AgentDataSchema = z.object({
  name: z.string(),
  status: z.enum(['idle', 'active', 'complete', 'error']),
  systemPrompt: z.string(),
  lastActivity: z.number(),
})

export const TeamProjectSchema = z.object({
  previewUrl: z.string().optional().default(''),
  prompts: z.record(z.string(), z.string()).optional().default({}),
})

export const TimelineEventSchema = z.object({
  agentName: z.string(),
  status: z.enum(['idle', 'active', 'complete', 'error']),
  fromStatus: z.enum(['idle', 'active', 'complete', 'error']).nullable().optional().default(null),
  timestamp: z.number(),
  message: z.string().optional(),
})

export const TeamDataSchema = z.object({
  name: z.string(),
  project: TeamProjectSchema.optional().default({ previewUrl: '', prompts: {} }),
  terminal: z.object({
    lines: z.record(z.string(), TerminalLineSchema).optional().default({}),
  }).optional().default({ lines: {} }),
  artifacts: z.record(z.string(), ArtifactSchema).optional().default({}),
  agents: z.record(z.string(), AgentDataSchema).optional().default({}),
  timeline: z.record(z.string(), TimelineEventSchema).optional().default({}),
})

export type TerminalLine = z.infer<typeof TerminalLineSchema>
export type Artifact = z.infer<typeof ArtifactSchema>
export type AgentData = z.infer<typeof AgentDataSchema>
export type TeamProject = z.infer<typeof TeamProjectSchema>
export type TeamData = z.infer<typeof TeamDataSchema>
export type TimelineEvent = z.infer<typeof TimelineEventSchema>
