import { spawnSync } from 'node:child_process';
const fail = message => { console.error(message); process.exit(1); };
const run = (cmd, args) => spawnSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const remoteResult = run('git', ['remote', 'get-url', '--push', 'origin']);
const remote = process.argv[2] || (remoteResult.status === 0 ? remoteResult.stdout.trim() : '');
if (!/^(?:https:\/\/github\.com\/|git@github\.com:|ssh:\/\/git@github\.com\/)charan-chauhan\/[A-Za-z0-9_.-]+(?:\.git)?\/?$/.test(remote)) {
  fail('Push blocked: the destination must be a repository owned by charan-chauhan on github.com.');
}
const identity = run('gh', ['api', 'user', '--jq', '.login']);
if (identity.status !== 0 || identity.stdout.trim().toLowerCase() !== 'charan-chauhan') {
  fail('Push blocked: authenticate GitHub CLI as charan-chauhan and verify Git transport credentials before pushing. Browser login alone is insufficient.');
}
console.log('Verified GitHub account and repository owner: charan-chauhan.');
