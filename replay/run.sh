#!/usr/bin/env bash
# Compile every clause in replay/clauses, then execute the generated replays on the ledger.
# The ledger run is what counts: the reference arithmetic in compile.mjs is only a pre-check.
set -eo pipefail
cd "$(dirname "$0")/.."

node replay/compile.mjs "$@"

# The packages pin SDK 3.5.2, the version the Canton quickstart uses and the one
# deployed to DevNet. That version is served by dpm, not by the older `daml
# install` channel, so dpm is preferred when it is present.
#
# The fallback matters: with only the legacy assistant the model still compiles,
# because it targets LF 2.2 either way — but the SDK that builds a DAR decides
# its package id, so a fallback build is a *different package* on a ledger. Fine
# for running the replays, not the artifact to upload.
: "${DAML_SDK_VERSION:=}"
DPM="$(command -v dpm || echo "$HOME/.dpm/bin/dpm")"
DAML="$(command -v daml || echo "$HOME/.daml/bin/daml")"
if [ -x "$DPM" ] && "$DPM" version >/dev/null 2>&1; then
  RUNNER="$DPM"
  TEST_FLAGS=()
else
  RUNNER="$DAML"
  TEST_FLAGS=(--no-legacy-assistant-warning)   # the assistant nags; dpm has no such flag
  if [ -z "$DAML_SDK_VERSION" ] && ! "$DAML" version 2>/dev/null | grep -q "3.5.2"; then
    export DAML_SDK_VERSION=3.4.11
    echo "!! dpm not found: building with SDK $DAML_SDK_VERSION, which yields a different package id than the one on DevNet"
  fi
fi
# daml test needs a JRE for the script service. macOS ships a /usr/bin/java stub that
# exists and then fails, so test that java actually runs rather than that it is on PATH.
# Homebrew keeps openjdk keg-only, hence the explicit JAVA_HOME.
if ! java -version >/dev/null 2>&1 && [ -d /opt/homebrew/opt/openjdk@17 ]; then
  export JAVA_HOME=/opt/homebrew/opt/openjdk@17
  export PATH="$JAVA_HOME/bin:$PATH"
fi

# The tests package takes the model as a data-dependency, so the DAR has to exist
# before they can be compiled. A fresh clone has no DAR, which used to fail here
# with a bare "openBinaryFile: does not exist".
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
