import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('Termux installer ships a real Pocket Workstation bootstrap flow', async () => {
  const installScript = await readFile(new URL('../install.sh', import.meta.url), 'utf8');
  const vercelConfig = await readFile(new URL('../vercel.json', import.meta.url), 'utf8');

  assert.match(installScript, /^#!\/usr\/bin\/env bash/m);
  assert.match(installScript, /3dvr install is built for Termux on Android/);
  assert.match(installScript, /pkg install -y git nodejs python vim tmux openssh curl/);
  assert.match(installScript, /npm install --prefix "\$\{RUNTIME_DIR\}" gun/);
  assert.match(installScript, /THREEDVR_HOME="\$\{HOME\}\/\.3dvr"/);
  assert.match(installScript, /CLI_PATH="\$\{BIN_DIR\}\/3dvr"/);
  assert.match(installScript, /THREEDVR_IDENTITY_KEY="alias-\$\{THREEDVR_ALIAS\}"/);
  assert.match(installScript, /3dvr Pocket Workstation CLI/);
  assert.match(installScript, /3dvr connect <email-or-alias>/);
  assert.match(installScript, /3dvr commands pull/);
  assert.match(installScript, /3dvr deploy/);
  assert.match(installScript, /get\('3dvr-portal'\)\s*\.get\('pocketWorkstation'\)\s*\.get\('users'\)/);
  assert.match(installScript, /Open the dashboard: %s\/pocket-workstation\//);

  assert.match(vercelConfig, /"source": "\/install"/);
  assert.match(vercelConfig, /"destination": "\/install\.sh"/);
  assert.match(vercelConfig, /"Content-Type"/);
  assert.match(vercelConfig, /text\/plain; charset=utf-8/);
});
