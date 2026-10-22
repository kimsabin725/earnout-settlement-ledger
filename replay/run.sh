#!/usr/bin/env bash
# Compile every clause in replay/clauses, then execute the generated replays on the ledger.
# The ledger run is what counts: the reference arithmetic in compile.mjs is only a pre-check.
set -eo pipefail
cd "$(dirname "$0")/.."

node replay/compile.mjs "$@"

# SDK 3.5.2 (the DevNet build) comes from dpm; a fallback SDK gives a different package id.
: "${DAML_SDK_VERSION:=}"
DPM="$(command -v dpm || echo "$HOME/.dpm/bin/dpm")"
DAML="$(command -v daml || echo "$HOME/.daml/bin/daml")"
if [ -x "$DPM" ] && "$DPM" version >/dev/null 2>&1; then
  RUNNER="$DPM"
  TEST_FLAGS=()
else
  RUNNER="$DAML"
  TEST_FLAGS=(--no-legacy-assistant-warning)
  if [ -z "$DAML_SDK_VERSION" ] && ! "$DAML" version 2>/dev/null | grep -q "3.5.2"; then
    export DAML_SDK_VERSION=3.4.11
    echo "!! dpm not found: building with SDK $DAML_SDK_VERSION, which yields a different package id than the one on DevNet"
  fi
fi
# macOS /usr/bin/java is a stub that fails, so check java runs; Homebrew openjdk is keg-only.
if ! java -version >/dev/null 2>&1 && [ -d /opt/homebrew/opt/openjdk@17 ]; then
  export JAVA_HOME=/opt/homebrew/opt/openjdk@17
  export PATH="$JAVA_HOME/bin:$PATH"
fi

# tests depend on the model DAR, which a fresh clone does not have yet.
echo
echo "== building the model"
( cd ledger && "$RUNNER" build ) | tail -1

echo
echo "== running the replays on the ledger"
cd tests
out=$("$RUNNER" test "${TEST_FLAGS[@]}" 2>&1) || true
echo "$out" | grep -E "^daml/|[Ee]rror|[Ff]ailed" || {
  echo "!! 원장 실행이 아무 결과도 내지 않았다. 도구 문제일 가능성이 높다:"
  echo "$out" | tail -5
  exit 1
}
