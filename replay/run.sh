#!/usr/bin/env bash
# Compile every clause in replay/clauses, then execute the generated replays on the ledger.
# The ledger run is what counts: the reference arithmetic in compile.mjs is only a pre-check.
set -eo pipefail
cd "$(dirname "$0")/.."

node replay/compile.mjs "$@"

# The project pins SDK 3.5.2 (the Canton 3.x line). If only another SDK is installed,
# DAML_SDK_VERSION can point the assistant at it — the model targets LF 2.2 either way.
: "${DAML_SDK_VERSION:=}"
DAML="$(command -v daml || echo "$HOME/.daml/bin/daml")"
if [ -z "$DAML_SDK_VERSION" ] && ! "$DAML" version 2>/dev/null | grep -q "3.5.2"; then
  export DAML_SDK_VERSION=3.4.11
fi
# daml test needs a JRE for the script service. macOS ships a /usr/bin/java stub that
# exists and then fails, so test that java actually runs rather than that it is on PATH.
# Homebrew keeps openjdk keg-only, hence the explicit JAVA_HOME.
if ! java -version >/dev/null 2>&1 && [ -d /opt/homebrew/opt/openjdk@17 ]; then
  export JAVA_HOME=/opt/homebrew/opt/openjdk@17
  export PATH="$JAVA_HOME/bin:$PATH"
fi

echo
echo "== running the replays on the ledger"
cd tests
"$DAML" test --no-legacy-assistant-warning 2>&1 | grep -E "^daml/|[Ee]rror|[Ff]ailed"
