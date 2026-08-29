#!/bin/bash
# Earnout Settlement Ledger — LocalNet end-to-end 시나리오
# splice-onboarding 컨테이너 안에서 실행 (source /app/utils.sh 전제)
set -eo pipefail
source /app/utils.sh

P="canton:3${PARTICIPANT_JSON_API_PORT_SUFFIX}"   # app-provider participant JSON API
UID_="$AUTH_APP_PROVIDER_VALIDATOR_USER_ID"
TOKEN=$(get_admin_token "$AUTH_APP_PROVIDER_VALIDATOR_CLIENT_SECRET" "$AUTH_APP_PROVIDER_VALIDATOR_CLIENT_ID" "$AUTH_APP_PROVIDER_TOKEN_URL")
echo "== participant=$P user=$UID_"

# 0) 패키지 존재 확인 (재시작 후 지속성 검증)
if ! curl -s -H "Authorization: Bearer $TOKEN" "http://$P/v2/packages" | grep -q "$EARNOUT_PKG"; then
  echo "package missing — re-uploading"
  curl -f -s -S -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/octet-stream" \
    --data-binary @/tmp/earnout-ledger-0.0.1.dar "http://$P/v2/packages" > /dev/null
  echo "re-uploaded"
fi
echo "== package OK"

# 1) 파티 할당
BUYER=$(allocate_party "$TOKEN" "EBuyer" "$P")
SELLER=$(allocate_party "$TOKEN" "ESeller" "$P")
ARBITER=$(allocate_party "$TOKEN" "EArbiter" "$P")
BANK=$(allocate_party "$TOKEN" "EBank" "$P")
echo "== parties: $BUYER / $SELLER / $ARBITER / $BANK"

# 2) validator 유저에 actAs/readAs 권한 부여
for PARTY in "$BUYER" "$SELLER" "$ARBITER" "$BANK"; do
  grant_rights "$TOKEN" "$UID_" "$PARTY" "ActAs ReadAs" "$P" > /dev/null || true
done
echo "== rights granted"

TPL="#earnout-ledger:Earnout"
ALLPARTIES="[\"$BUYER\",\"$SELLER\",\"$ARBITER\",\"$BANK\"]"

# submit: submit-and-wait-for-transaction 으로 생성된 contractId 회수
submit() { # $1 actAsJson  $2 commandsJson  $3 label
  local body=$(cat <<EOF
{
  "commands": {
    "commands": $2,
    "workflowId": "earnout-scenario",
    "applicationId": "$UID_",
    "commandId": "earnout-$3-$(date +%s%N)",
    "deduplicationPeriod": { "Empty": {} },
    "actAs": $1,
    "readAs": $ALLPARTIES,
    "submissionId": "earnout-$3",
    "disclosedContracts": [],
    "domainId": "",
    "packageIdSelectionPreference": []
  },
  "transactionFormat": {
    "eventFormat": {
      "filtersByParty": {
        "$BUYER":   { "cumulative": [ { "identifierFilter": { "WildcardFilter": { "value": { "includeCreatedEventBlob": false } } } } ] },
        "$SELLER":  { "cumulative": [ { "identifierFilter": { "WildcardFilter": { "value": { "includeCreatedEventBlob": false } } } } ] },
        "$ARBITER": { "cumulative": [ { "identifierFilter": { "WildcardFilter": { "value": { "includeCreatedEventBlob": false } } } } ] },
        "$BANK":    { "cumulative": [ { "identifierFilter": { "WildcardFilter": { "value": { "includeCreatedEventBlob": false } } } } ] }
      },
      "verbose": false
    },
    "transactionShape": "TRANSACTION_SHAPE_ACS_DELTA"
  }
}
EOF
)
  curl -f -s -S -X POST "http://$P/v2/commands/submit-and-wait-for-transaction" \
    -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    --data-raw "$body"
}
cid_of() { # $1 json  $2 entity  → 마지막 매칭 contractId
  echo "$1" | jq -r --arg e "$2" '[.transaction.events[]? | (.CreatedTreeEvent.value // .CreatedEvent // .created // empty) | select((.templateId // "") | endswith(":"+$e))] | last | .contractId'
}

# 3) 계약: Propose → Accept (조건 고정)
R=$(submit "[\"$BUYER\"]" "[{\"CreateCommand\":{\"templateId\":\"$TPL:EarnoutProposal\",\"createArguments\":{
  \"buyer\":\"$BUYER\",\"seller\":\"$SELLER\",\"arbiter\":\"$ARBITER\",
  \"terms\":{\"metricName\":\"Quarterly Operating Net Cash Flow\",\"quarterlyTarget\":\"80000000.0\",
             \"totalQuarters\":\"4\",\"requiredMet\":\"3\",\"trancheAmount\":\"400000000.0\"}}}}]" propose)
PROP=$(cid_of "$R" "EarnoutProposal"); echo "== proposal: $PROP"

R=$(submit "[\"$SELLER\"]" "[{\"ExerciseCommand\":{\"templateId\":\"$TPL:EarnoutProposal\",\"contractId\":\"$PROP\",\"choice\":\"Accept\",\"choiceArgument\":{}}}]" accept)
AGR=$(cid_of "$R" "EarnoutAgreement"); echo "== agreement: $AGR"

# 4) 분기 판정 Q1·Q2 충족 / Q3 플래그 / Q4 미달
q() { submit "[\"$BUYER\"]" "[{\"ExerciseCommand\":{\"templateId\":\"$TPL:EarnoutAgreement\",\"contractId\":\"$AGR\",\"choice\":\"SubmitQuarter\",\"choiceArgument\":{\"quarter\":\"$1\",\"metricValue\":\"$2\",\"oneOffOutflows\":\"$3\",\"basisHash\":\"sha256:q$1\"}}}]" "q$1"; }
V1=$(cid_of "$(q 1 92000000.0 0.0)" "QuarterVerdict"); echo "== Q1 verdict: $V1 (met)"
V2=$(cid_of "$(q 2 86000000.0 0.0)" "QuarterVerdict"); echo "== Q2 verdict: $V2 (met)"
V3=$(cid_of "$(q 3 51000000.0 30000000.0)" "QuarterVerdict"); echo "== Q3 verdict: $V3 (FLAGGED)"
V4=$(cid_of "$(q 4 79000000.0 0.0)" "QuarterVerdict"); echo "== Q4 verdict: $V4 (not met)"

# 5) Q3 이의 → 중재 정정
R=$(submit "[\"$SELLER\"]" "[{\"ExerciseCommand\":{\"templateId\":\"$TPL:QuarterVerdict\",\"contractId\":\"$V3\",\"choice\":\"RaiseDispute\",\"choiceArgument\":{}}}]" dispute)
DISP=$(cid_of "$R" "Dispute"); echo "== dispute: $DISP"
R=$(submit "[\"$ARBITER\"]" "[{\"ExerciseCommand\":{\"templateId\":\"$TPL:Dispute\",\"contractId\":\"$DISP\",\"choice\":\"Resolve\",\"choiceArgument\":{\"verdictCid\":\"$V3\",\"resolvedMet\":true,\"reasoning\":\"one-off consulting fee excluded per SPA\"}}}]" resolve)
V3R=$(cid_of "$R" "QuarterVerdict"); echo "== Q3 resolved verdict: $V3R (met by arbiter)"

# 6) [위조 시도] buyer 단독 verdict 생성 → 거부되어야 함
set +e
FORGE=$(submit "[\"$BUYER\"]" "[{\"CreateCommand\":{\"templateId\":\"$TPL:QuarterVerdict\",\"createArguments\":{
  \"buyer\":\"$BUYER\",\"seller\":\"$SELLER\",\"arbiter\":\"$ARBITER\",\"quarter\":\"4\",
  \"metricValue\":\"99000000.0\",\"basisHash\":\"sha256:forged\",\"met\":true,\"flagged\":false,\"resolution\":null}}}]" forge 2>&1)
FRC=$?
set -e
if [ $FRC -ne 0 ]; then echo "== FORGERY REJECTED by ledger ✓"; else echo "== !! forgery accepted — MODEL BUG"; echo "$FORGE" | head -c 300; exit 1; fi

# 7) Finalize (3/4 충족) → SettlementObligation
R=$(submit "[\"$SELLER\"]" "[{\"ExerciseCommand\":{\"templateId\":\"$TPL:EarnoutAgreement\",\"contractId\":\"$AGR\",\"choice\":\"Finalize\",\"choiceArgument\":{\"verdictCids\":[\"$V1\",\"$V2\",\"$V3R\",\"$V4\"]}}}]" finalize)
OBL=$(cid_of "$R" "SettlementObligation"); echo "== settlement obligation: $OBL"

# 8) 지급: CashToken 발행(BANK) → Settle (토큰이전+종결 atomic)
R=$(submit "[\"$BANK\"]" "[{\"CreateCommand\":{\"templateId\":\"$TPL:CashToken\",\"createArguments\":{\"issuer\":\"$BANK\",\"owner\":\"$BUYER\",\"amount\":\"400000000.0\"}}}]" mint)
CASH=$(cid_of "$R" "CashToken"); echo "== cash token: $CASH"
R=$(submit "[\"$BUYER\"]" "[{\"ExerciseCommand\":{\"templateId\":\"$TPL:SettlementObligation\",\"contractId\":\"$OBL\",\"choice\":\"Settle\",\"choiceArgument\":{\"tokenCid\":\"$CASH\"}}}]" settle)
PAID=$(cid_of "$R" "CashToken"); CLOSED=$(cid_of "$R" "EarnoutClosed")
echo "== paid token (owner=SELLER): $PAID"
echo "== closed: $CLOSED"
echo ""
echo "=================================================="
echo " E2E SCENARIO COMPLETE ON LOCALNET ✓"
echo "=================================================="
