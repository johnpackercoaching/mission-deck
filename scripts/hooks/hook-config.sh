#!/bin/bash
# hook-config.sh — Shared configuration for Mission Deck reporter hooks.
# Sourced by pretool and posttool hooks. All values can be overridden by env vars.

# Team ID to report to (matches config.ts TEAMS)
MISSION_DECK_TEAM_ID="${MISSION_DECK_TEAM_ID:-t01}"

# Absolute path to the mission-deck project
MISSION_DECK_PROJECT_DIR="${MISSION_DECK_PROJECT_DIR:-/Users/johnye/mission-deck}"

# Path to the reporter CLI script
MISSION_DECK_REPORTER="${MISSION_DECK_PROJECT_DIR}/scripts/report-cli.ts"

# Service account path (reporter reads this itself, we just check existence)
MISSION_DECK_SERVICE_ACCOUNT="${MISSION_DECK_PROJECT_DIR}/service-account.json"

# Log file for debugging (set to /dev/null to disable)
MISSION_DECK_HOOK_LOG="${MISSION_DECK_HOOK_LOG:-/dev/null}"

# JP Rocks agent IDs that we track
MISSION_DECK_AGENTS_PATTERN="^(project-resume-agent|next-steps-agent|product-manager-agent|plan-builder-agent|plan-validation-agent|blocker-analysis-agent|execution-agent|playwright-test-agent)(-team[0-9]+)?$"

# Fire-and-forget helper: runs reporter CLI in background, suppresses all output
# Usage: fire_report <command> <args...>
fire_report() {
  # Guard: service account must exist
  if [ ! -f "$MISSION_DECK_SERVICE_ACCOUNT" ]; then
    return 0
  fi

  # Guard: reporter script must exist
  if [ ! -f "$MISSION_DECK_REPORTER" ]; then
    return 0
  fi

  # Run in background, suppress all output, ignore failures
  (cd "$MISSION_DECK_PROJECT_DIR" && npx tsx "$MISSION_DECK_REPORTER" "$@" >> "$MISSION_DECK_HOOK_LOG" 2>&1) &
  disown 2>/dev/null
  return 0
}
