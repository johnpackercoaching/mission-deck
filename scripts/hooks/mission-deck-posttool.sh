#!/bin/bash
# mission-deck-posttool.sh — PostToolUse hook for Mission Deck reporter.
# Detects when JP Rocks agents complete and reports them as "complete".
# Also reports artifacts for Write/Edit and terminal lines for Bash.
#
# Hook contract:
#   stdin:  JSON with tool_name, tool_input, tool_result
#   stdout: plain text or nothing
#   exit 0: always

HOOK_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$HOOK_DIR/hook-config.sh"

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')

case "$TOOL_NAME" in
  Task)
    AGENT_TYPE=$(echo "$INPUT" | jq -r '.tool_input.subagent_type // empty')

    # Check if this is a JP Rocks agent we track
    if echo "$AGENT_TYPE" | grep -qE "$MISSION_DECK_AGENTS_PATTERN"; then
      AGENT_NAME=$(echo "$AGENT_TYPE" | sed 's/-team[0-9]*$//' | sed 's/-agent$//' | sed 's/-/ /g' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) tolower(substr($i,2))}1')

      fire_report status "$MISSION_DECK_TEAM_ID" "$AGENT_TYPE" complete "$AGENT_NAME"
      fire_report terminal "$MISSION_DECK_TEAM_ID" "[hook] Agent complete: $AGENT_TYPE" system
    fi
    ;;

  Write)
    FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
    if [ -n "$FILE_PATH" ]; then
      FILE_NAME=$(basename "$FILE_PATH")
      FILE_EXT="${FILE_NAME##*.}"
      fire_report artifact "$MISSION_DECK_TEAM_ID" "$FILE_NAME" "$FILE_PATH" "$FILE_EXT"
      fire_report terminal "$MISSION_DECK_TEAM_ID" "[hook] File created: $FILE_NAME" stdout
    fi
    ;;

  Edit|MultiEdit)
    FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
    if [ -n "$FILE_PATH" ]; then
      FILE_NAME=$(basename "$FILE_PATH")
      FILE_EXT="${FILE_NAME##*.}"
      fire_report artifact "$MISSION_DECK_TEAM_ID" "$FILE_NAME" "$FILE_PATH" "$FILE_EXT"
      fire_report terminal "$MISSION_DECK_TEAM_ID" "[hook] File modified: $FILE_NAME" stdout
    fi
    ;;

  Bash)
    COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')
    if [ -n "$COMMAND" ]; then
      SHORT_CMD=$(echo "$COMMAND" | head -c 200)
      fire_report terminal "$MISSION_DECK_TEAM_ID" "[bash] $SHORT_CMD" stdout
    fi
    ;;
esac

exit 0
