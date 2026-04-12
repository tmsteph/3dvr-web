#!/usr/bin/env bash
set -euo pipefail

if ! command -v pkg >/dev/null 2>&1 || [ ! -d "/data/data/com.termux/files" ]; then
  echo "3dvr install is built for Termux on Android." >&2
  exit 1
fi

THREEDVR_HOME="${HOME}/.3dvr"
BIN_DIR="${HOME}/bin"
RUNTIME_DIR="${THREEDVR_HOME}/runtime"
CACHE_DIR="${THREEDVR_HOME}/cache"
CONFIG_PATH="${THREEDVR_HOME}/config"
FETCHER_PATH="${THREEDVR_HOME}/fetch-pocket-workstation.cjs"
CLI_PATH="${BIN_DIR}/3dvr"
PORTAL_ORIGIN="${THREEDVR_PORTAL_ORIGIN:-https://portal.3dvr.tech}"

mkdir -p "${THREEDVR_HOME}" "${BIN_DIR}" "${RUNTIME_DIR}" "${CACHE_DIR}"

append_path_block() {
  target_file="$1"
  if [ ! -f "${target_file}" ]; then
    touch "${target_file}"
  fi

  if ! grep -q "3dvr-pocket-workstation-path" "${target_file}" 2>/dev/null; then
    cat >> "${target_file}" <<'EOF'

# 3dvr-pocket-workstation-path
if [ -d "${HOME}/bin" ] && ! printf '%s' "${PATH}" | grep -q "${HOME}/bin"; then
  export PATH="${HOME}/bin:${PATH}"
fi
EOF
  fi
}

printf '\n[3dvr] Installing Termux packages...\n'
pkg update -y >/dev/null
pkg install -y git nodejs python vim tmux openssh curl >/dev/null

append_path_block "${HOME}/.bashrc"
append_path_block "${HOME}/.profile"
if [ -f "${HOME}/.zshrc" ]; then
  append_path_block "${HOME}/.zshrc"
fi

cat > "${RUNTIME_DIR}/package.json" <<'EOF'
{
  "name": "3dvr-pocket-workstation-runtime",
  "private": true
}
EOF

printf '[3dvr] Installing runtime dependencies...\n'
npm install --prefix "${RUNTIME_DIR}" gun >/dev/null

cat > "${FETCHER_PATH}" <<'EOF'
#!/usr/bin/env node
const path = require('path');

const homeDir = process.env.HOME || process.cwd();
const gunPath = path.join(homeDir, '.3dvr', 'runtime', 'node_modules', 'gun');
const originalLog = console.log;
const originalWarn = console.warn;
console.log = () => {};
console.warn = () => {};
const Gun = require(gunPath);
console.log = originalLog;
console.warn = originalWarn;

const mode = String(process.argv[2] || 'records').trim();
const identityKey = String(process.argv[3] || '').trim();
const recordType = String(process.argv[4] || 'commands').trim();
const pairingCode = String(process.argv[5] || '').trim().toUpperCase();

const gun = Gun({
  peers: [
    'wss://relay.3dvr.tech/gun',
    'wss://gun-relay-3dvr.fly.dev/gun'
  ],
  axe: false,
  multicast: false,
  radisk: false,
  localStorage: false
});

if (mode === 'pairing') {
  if (!pairingCode) {
    process.stdout.write('{}');
    process.exit(0);
  }

  gun
    .get('3dvr-portal')
    .get('pocketWorkstation')
    .get('pairing')
    .get(pairingCode)
    .once(data => {
      process.stdout.write(JSON.stringify(data || {}));
      process.exit(0);
    });

  setTimeout(() => {
    process.stdout.write('{}');
    process.exit(0);
  }, 2200);
} else {
  if (!identityKey) {
    process.stdout.write('[]');
    process.exit(0);
  }

  const node = gun
    .get('3dvr-portal')
    .get('pocketWorkstation')
    .get('users')
    .get(identityKey)
    .get(recordType);

  const records = new Map();
  const subscription = node.map().on((data, key) => {
    if (!data || key === '_' || typeof data !== 'object') {
      return;
    }
    const id = String(data.id || key);
    records.set(id, { ...data, id });
  });

  setTimeout(() => {
    if (subscription && typeof subscription.off === 'function') {
      subscription.off();
    }
    const ordered = Array.from(records.values()).sort((a, b) => Number(b.updatedAt || 0) - Number(a.updatedAt || 0));
    process.stdout.write(JSON.stringify(ordered));
    process.exit(0);
  }, 2200);
}
EOF

chmod +x "${FETCHER_PATH}"

cat > "${CLI_PATH}" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

THREEDVR_HOME="${HOME}/.3dvr"
CONFIG_PATH="${THREEDVR_HOME}/config"
FETCHER_PATH="${THREEDVR_HOME}/fetch-pocket-workstation.cjs"
CACHE_DIR="${THREEDVR_HOME}/cache"
PORTAL_ORIGIN="${THREEDVR_PORTAL_ORIGIN:-https://portal.3dvr.tech}"

mkdir -p "${THREEDVR_HOME}" "${CACHE_DIR}"

if [ -f "${CONFIG_PATH}" ]; then
  # shellcheck disable=SC1090
  . "${CONFIG_PATH}"
fi

normalize_alias() {
  printf '%s' "$1" | tr '[:upper:]' '[:lower:]'
}

normalize_code() {
  printf '%s' "$1" | tr '[:lower:]' '[:upper:]' | tr -cd 'A-Z0-9' | cut -c1-6
}

generate_pair_code() {
  python3 - <<'PY'
import random

alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
print("".join(random.choice(alphabet) for _ in range(6)))
PY
}

save_config() {
  cat > "${CONFIG_PATH}" <<CONFIG
THREEDVR_ALIAS="${THREEDVR_ALIAS:-}"
THREEDVR_IDENTITY_KEY="${THREEDVR_IDENTITY_KEY:-}"
THREEDVR_PORTAL_ORIGIN="${PORTAL_ORIGIN}"
CONFIG
}

need_identity() {
  if [ -z "${THREEDVR_IDENTITY_KEY:-}" ]; then
    echo "No 3dvr identity connected yet. Run: 3dvr connect your@email.com" >&2
    exit 1
  fi
}

open_url() {
  url="$1"
  if command -v termux-open-url >/dev/null 2>&1; then
    termux-open-url "${url}" >/dev/null 2>&1 || true
    printf '%s\n' "${url}"
    return 0
  fi
  printf '%s\n' "${url}"
}

poll_pairing_code() {
  pair_code="$1"
  pair_cache="${CACHE_DIR}/pairing-${pair_code}.json"

  for _attempt in 1 2 3 4 5 6 7 8 9 10 11 12; do
    node "${FETCHER_PATH}" "pairing" "_" "_" "${pair_code}" > "${pair_cache}"
    if python3 - "${pair_cache}" <<'PY'
import json
import pathlib
import sys

cache_file = pathlib.Path(sys.argv[1])
data = json.loads(cache_file.read_text()) if cache_file.exists() else {}
if data.get('identityKey'):
    print(data.get('alias', ''))
    print(data.get('identityKey', ''))
    raise SystemExit(0)
raise SystemExit(1)
PY
    then
      return 0
    fi
    sleep 5
  done

  return 1
}

print_records() {
  record_type="$1"
  cache_file="$2"
  python3 - "$record_type" "$cache_file" <<'PY'
import json
import pathlib
import sys

record_type = sys.argv[1]
cache_file = pathlib.Path(sys.argv[2])
if not cache_file.exists():
    print(f"No cached {record_type}.")
    raise SystemExit(0)

try:
    records = json.loads(cache_file.read_text())
except Exception:
    print(f"Unable to parse cached {record_type}.")
    raise SystemExit(1)

if not records:
    print(f"No {record_type} found.")
    raise SystemExit(0)

for record in records:
    if record_type == 'commands':
        name = record.get('name', 'Untitled command')
        context = record.get('context', '')
        command = record.get('command', '')
        print(f"- {name}")
        if context:
            print(f"  context: {context}")
        if command:
            print(f"  command: {command}")
    elif record_type == 'projects':
        name = record.get('name', 'Untitled project')
        status = record.get('status', '')
        next_step = record.get('nextStep', '')
        print(f"- {name}")
        if status:
            print(f"  status: {status}")
        if next_step:
            print(f"  next: {next_step}")
    else:
        title = record.get('title', 'Untitled note')
        body = record.get('body', '')
        print(f"- {title}")
        if body:
            print(f"  note: {body}")
PY
}

pull_records() {
  record_type="$1"
  need_identity
  cache_file="${CACHE_DIR}/${record_type}.json"
  node "${FETCHER_PATH}" "records" "${THREEDVR_IDENTITY_KEY}" "${record_type}" > "${cache_file}"
  print_records "${record_type}" "${cache_file}"
}

show_help() {
  cat <<'HELP'
3dvr Pocket Workstation CLI

Usage:
  3dvr connect [email-or-alias]
  3dvr whoami
  3dvr open [portal|workstation|notes|commands|projects]
  3dvr notes
  3dvr projects
  3dvr commands [pull]
  3dvr deploy

Examples:
  3dvr connect
  3dvr connect you@example.com
  3dvr commands pull
  3dvr deploy
HELP
}

command_name="${1:-help}"
shift || true

case "${command_name}" in
  help|-h|--help)
    show_help
    ;;
  connect)
    alias_value="${1:-}"
    if [ -z "${alias_value}" ]; then
      pair_code="$(generate_pair_code)"
      pair_url="${PORTAL_ORIGIN}/pocket-workstation/?pairCode=${pair_code}#connect-title"
      echo "Open this link on a signed-in portal session and enter the code:"
      echo "${pair_code}"
      open_url "${pair_url}"
      echo "Waiting for Pocket Workstation to link the code..."
      if poll_pairing_code "${pair_code}"; then
        pair_cache="${CACHE_DIR}/pairing-${pair_code}.json"
        THREEDVR_ALIAS="$(python3 - "${pair_cache}" <<'PY'
import json
import pathlib
import sys
data = json.loads(pathlib.Path(sys.argv[1]).read_text())
print(data.get('alias', ''))
PY
)"
        THREEDVR_IDENTITY_KEY="$(python3 - "${pair_cache}" <<'PY'
import json
import pathlib
import sys
data = json.loads(pathlib.Path(sys.argv[1]).read_text())
print(data.get('identityKey', ''))
PY
)"
        save_config
        echo "Connected Pocket Workstation identity: ${THREEDVR_ALIAS}"
        echo "Next step: 3dvr commands pull"
        exit 0
      fi
      echo "No pairing response yet."
      echo "Keep the portal open at ${pair_url} and try: 3dvr connect"
      exit 1
    fi
    THREEDVR_ALIAS="$(normalize_alias "${alias_value}")"
    THREEDVR_IDENTITY_KEY="alias-${THREEDVR_ALIAS}"
    save_config
    echo "Connected Pocket Workstation identity: ${THREEDVR_ALIAS}"
    echo "Next step: 3dvr commands pull"
    ;;
  whoami)
    if [ -n "${THREEDVR_ALIAS:-}" ]; then
      echo "alias: ${THREEDVR_ALIAS}"
      echo "identity: ${THREEDVR_IDENTITY_KEY:-}"
    else
      echo "No identity connected."
    fi
    ;;
  open)
    target="${1:-workstation}"
    case "${target}" in
      portal) open_url "${PORTAL_ORIGIN}/" ;;
      workstation) open_url "${PORTAL_ORIGIN}/pocket-workstation/" ;;
      notes) open_url "${PORTAL_ORIGIN}/pocket-workstation/#notes-title" ;;
      commands) open_url "${PORTAL_ORIGIN}/pocket-workstation/#commands-title" ;;
      projects) open_url "${PORTAL_ORIGIN}/pocket-workstation/#projects-title" ;;
      *)
        echo "Unknown open target: ${target}" >&2
        exit 1
        ;;
    esac
    ;;
  notes)
    open_url "${PORTAL_ORIGIN}/pocket-workstation/#notes-title"
    ;;
  projects)
    pull_records "projects"
    ;;
  commands)
    action="${1:-pull}"
    case "${action}" in
      pull|list)
        pull_records "commands"
        ;;
      *)
        echo "Unknown commands action: ${action}" >&2
        exit 1
        ;;
    esac
    ;;
  deploy)
    need_identity
    cache_file="${CACHE_DIR}/commands.json"
    node "${FETCHER_PATH}" "records" "${THREEDVR_IDENTITY_KEY}" "commands" > "${cache_file}"
    python3 - "${cache_file}" <<'PY'
import json
import pathlib
import sys

cache_file = pathlib.Path(sys.argv[1])
records = json.loads(cache_file.read_text()) if cache_file.exists() else []
matches = []
for record in records:
    haystack = " ".join(
        str(record.get(key, '')).lower()
        for key in ('name', 'context', 'command')
    )
    if 'deploy' in haystack or 'vercel' in haystack or 'git push' in haystack:
        matches.append(record)

if not matches:
    print("No deploy-flavored commands found yet.")
    print("Save one in Pocket Workstation, then run: 3dvr commands pull")
    raise SystemExit(0)

for record in matches:
    print(f"- {record.get('name', 'Untitled command')}")
    command = record.get('command', '')
    if command:
        print(f"  command: {command}")
PY
    ;;
  *)
    show_help
    exit 1
    ;;
esac
EOF

chmod +x "${CLI_PATH}"

if [ ! -f "${CONFIG_PATH}" ]; then
  cat > "${CONFIG_PATH}" <<CONFIG
THREEDVR_ALIAS=""
THREEDVR_IDENTITY_KEY=""
THREEDVR_PORTAL_ORIGIN="${PORTAL_ORIGIN}"
CONFIG
fi

printf '\n[3dvr] Install complete.\n'
printf '[3dvr] Open the dashboard: %s/pocket-workstation/\n' "${PORTAL_ORIGIN}"
printf '[3dvr] Connect your identity: 3dvr connect\n'
printf '[3dvr] Pull your commands: 3dvr commands pull\n'
