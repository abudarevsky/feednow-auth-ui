#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$repo_root"
backend_root="${FEEDNOW_AUTH_DIR:-$(cd "$repo_root/../feednow-auth" 2>/dev/null && pwd || true)}"
profile=""
environment=""
usage() {
  cat <<'EOF'
Usage: deploy/aws/deploy.sh --profile AWS_PROFILE --env dev|staging|prod

Uses the same standard AWS profile and environment file as feednow-auth. The
backend stack's ApiEndpoint output supplies the same-origin CloudFront API.
EOF
}
while (($#)); do
  case "$1" in
    --profile) (($# >= 2)) || { usage >&2; exit 2; }; profile="$2"; shift 2 ;;
    --env) (($# >= 2)) || { usage >&2; exit 2; }; environment="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) usage >&2; exit 2 ;;
  esac
done
[[ -n "$profile" && -n "$environment" && "$environment" =~ ^(dev|staging|prod)$ ]] || { usage >&2; exit 2; }
[[ -r "$backend_root/deploy/aws/env.sh" ]] || { echo "Cannot find feednow-auth environment loader at $backend_root" >&2; exit 2; }
# shellcheck source=../../../../feednow-auth/deploy/aws/env.sh
source "$backend_root/deploy/aws/env.sh"
feednow_load_env "$backend_root" "$environment"
# Backend-only KMS ciphertext must not flow into the frontend build or tests.
unset FEEDNOW_PEPPER_CIPHERTEXT_B64
export AWS_PROFILE="$profile"
actual_account="$(feednow_verify_identity "$profile" "$AWS_ACCOUNT_ID" "$AWS_REGION")"
feednow_show_target "$environment" "$profile" "$actual_account" "$AWS_REGION"

api_domain="$(aws cloudformation describe-stacks --profile "$profile" --region "$AWS_REGION" \
  --stack-name "FeedNowAuth-$environment" \
  --query "Stacks[0].Outputs[?OutputKey=='ApiEndpoint'].OutputValue | [0]" --output text)"
[[ -n "$api_domain" && "$api_domain" != "None" ]] || { echo "Backend stack has no ApiEndpoint output" >&2; exit 1; }
api_domain="${api_domain#https://}"
api_domain="${api_domain%/}"

stack_name="feednow-account-ui-${environment}"
parameters=("ApiGatewayDomainName=${api_domain}")
if [[ -n "${ACCOUNT_DOMAIN_NAME:-}" ]]; then
  : "${ACM_CERTIFICATE_ARN:?Set ACM_CERTIFICATE_ARN in the selected environment file}"
  : "${ROUTE53_HOSTED_ZONE_ID:?Set ROUTE53_HOSTED_ZONE_ID in the selected environment file}"
  [[ "$ACM_CERTIFICATE_ARN" == arn:*:acm:us-east-1:*:certificate/* ]] || {
    echo "ACM_CERTIFICATE_ARN must identify an ACM certificate in us-east-1" >&2; exit 2;
  }
  parameters+=("AccountDomainName=${ACCOUNT_DOMAIN_NAME}")
  parameters+=("CertificateArn=${ACM_CERTIFICATE_ARN}")
  parameters+=("HostedZoneId=${ROUTE53_HOSTED_ZONE_ID}")
  certificate="$(aws acm describe-certificate --profile "$profile" --region us-east-1 \
    --certificate-arn "$ACM_CERTIFICATE_ARN" --output json)"
  jq -e --arg domain "$ACCOUNT_DOMAIN_NAME" '
    .Certificate.Status == "ISSUED" and
    ((.Certificate.DomainName == $domain) or
     ((.Certificate.SubjectAlternativeNames // []) | index($domain) != null))
  ' <<<"$certificate" >/dev/null || {
    echo "ACM certificate must be issued and cover $ACCOUNT_DOMAIN_NAME" >&2; exit 2;
  }
  zone="$(aws route53 get-hosted-zone --profile "$profile" \
    --id "$ROUTE53_HOSTED_ZONE_ID" --output json)"
  zone_name="$(jq -r '.HostedZone.Name' <<<"$zone" | sed 's/\.$//')"
  private_zone="$(jq -r '.HostedZone.Config.PrivateZone' <<<"$zone")"
  [[ "$private_zone" == "false" && ( "$ACCOUNT_DOMAIN_NAME" == "$zone_name" || "$ACCOUNT_DOMAIN_NAME" == *."$zone_name" ) ]] || {
    echo "Route 53 hosted zone must be public and contain $ACCOUNT_DOMAIN_NAME" >&2; exit 2;
  }
fi

npm run check
npm run test:e2e
echo "Deploying CloudFront/S3 stack: $stack_name"
aws cloudformation deploy \
  --profile "$profile" \
  --region "$AWS_REGION" \
  --stack-name "$stack_name" \
  --template-file deploy/aws/account-ui.yaml \
  --parameter-overrides "${parameters[@]}"

stack_json="$(aws cloudformation describe-stacks --profile "$profile" --region "$AWS_REGION" --stack-name "$stack_name" --output json)"
bucket="$(jq -r '.Stacks[0].Outputs[] | select(.OutputKey == "SiteBucketName") | .OutputValue' <<<"$stack_json")"
distribution_id="$(jq -r '.Stacks[0].Outputs[] | select(.OutputKey == "DistributionId") | .OutputValue' <<<"$stack_json")"
[[ -n "$bucket" && "$bucket" != "None" && -n "$distribution_id" && "$distribution_id" != "None" ]] || {
  echo "UI stack is missing its S3 bucket or CloudFront distribution output" >&2; exit 1;
}
echo "Uploading hashed UI assets to s3://$bucket"
aws s3 sync dist "s3://${bucket}" --profile "$profile" --region "$AWS_REGION" --delete \
  --exclude index.html --cache-control 'public,max-age=31536000,immutable'
echo "Uploading index.html with revalidation cache policy"
aws s3 cp dist/index.html "s3://${bucket}/index.html" --profile "$profile" --region "$AWS_REGION" \
  --content-type 'text/html; charset=utf-8' --cache-control 'public,max-age=0,must-revalidate'
echo "Creating CloudFront invalidation for distribution $distribution_id"
invalidation_id="$(aws cloudfront create-invalidation --profile "$profile" \
  --distribution-id "$distribution_id" --paths '/*' \
  --query 'Invalidation.Id' --output text)"
[[ -n "$invalidation_id" && "$invalidation_id" != "None" ]] || {
  echo "CloudFront did not return an invalidation ID" >&2; exit 1;
}
echo "Waiting for CloudFront invalidation $invalidation_id to complete"
aws cloudfront wait invalidation-completed --profile "$profile" \
  --distribution-id "$distribution_id" --id "$invalidation_id"
echo "Waiting for CloudFront distribution $distribution_id to finish deploying"
aws cloudfront wait distribution-deployed --profile "$profile" --id "$distribution_id"
domain="$(jq -r '.Stacks[0].Outputs[] | select(.OutputKey == "DistributionDomainName") | .OutputValue' <<<"$stack_json")"
if [[ -n "${ACCOUNT_DOMAIN_NAME:-}" ]]; then domain="$ACCOUNT_DOMAIN_NAME"; fi
origin="https://${domain}"
html_file="$(mktemp -t feednow-account-index)"
trap 'rm -f "$html_file"' EXIT
echo "Running CloudFront edge smoke checks at $origin"
for route in / /account /account/admin; do
  curl --fail --silent --show-error --retry 12 --retry-delay 5 --retry-all-errors \
    "$origin$route" -o "$html_file"
done
asset_path="$(grep -oE '/assets/[^"[:space:]]+' "$html_file" | head -n 1)"
[[ -n "$asset_path" ]] || { echo "CloudFront index has no hashed asset path" >&2; exit 1; }
asset_cache="$(curl --fail --silent --show-error --retry 5 --retry-all-errors \
  --head "$origin$asset_path" | tr -d '\r' | awk 'tolower($1) == "cache-control:" {print tolower($0)}')"
[[ "$asset_cache" == *immutable* ]] || { echo "Hashed UI asset is not immutably cached" >&2; exit 1; }
api_result="$(curl --silent --show-error --retry 5 --retry-all-errors \
  -o /dev/null -w '%{http_code}|%{content_type}' "$origin/api/__cloudfront_smoke_probe__")"
api_status="${api_result%%|*}"
api_content_type="${api_result#*|}"
[[ "$api_status" =~ ^[45][0-9][0-9]$ && "$api_content_type" != text/html* ]] || {
  echo "Unknown /api route did not preserve an API error (status/content-type: $api_result)" >&2
  exit 1
}
echo "Account UI deployment complete; CloudFront edge smoke checks passed at $origin"
