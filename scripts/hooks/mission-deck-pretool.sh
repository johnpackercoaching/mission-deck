#!/bin/bash
# mission-deck-pretool.sh — PreToolUse hook for Mission Deck reporter.
# Detects when JP Rocks agents are about to start and reports them as "active".
#
# Hook contract:
#   stdin:  JSON with tool_name, tool_input
#   stdout: JSON (empty object — never blocks tool execution)
#   exit 0: always

HOOK_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$HOOK_DIR/hook-config.sh"

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')

# Only process Task tool calls (agent spawning)
if [ "$TOOL_NAME" = "Task" ]; then
  AGENT_TYPE=$(echo "$INPUT" | jq -r '.tool_input.subagent_type // empty')

  # Check if this is a JP Rocks agent we track
  if echo "$AGENT_TYPE" | grep -qE "$MISSION_DECK_AGENTS_PATTERN"; then
    # Extract human-readable name: "execution-agent-team2" -> "Execution"
    AGENT_NAME=$(echo "$AGENT_TYPE" | sed 's/-team[0-9]*$//' | sed 's/-agent$//' | sed 's/-/ /g' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) tolower(substr($i,2))}1')

    # Report agent as active (fire-and-forget)
    fire_report status "$MISSION_DECK_TEAM_ID" "$AGENT_TYPE" active "$AGENT_NAME"
    fire_report terminal "$MISSION_DECK_TEAM_ID" "[hook] Agent starting: $AGENT_TYPE" system
  fi
fi

# Always exit 0 — never block tool execution
exit 0
