// Builds Misskey's config file from Railway variables.
// YAML is a superset of JSON, so the file is written as JSON: no quoting issues.
import { writeFileSync } from 'node:fs';
import { connect } from 'node:net';

const env = process.env;
const fail = (msg) => { console.error(`[railway] ${msg}`); process.exit(1); };

const parseUrl = (name) => {
  const raw = env[name];
  if (!raw) fail(`${name} is not set`);
  try { return new URL(raw); } catch { fail(`${name} is not a valid URL`); }
};

const url = env.MISSKEY_URL;
if (!url || !/^https?:\/\/[^/]+/.test(url)) fail('MISSKEY_URL must be like https://YOUR-DOMAIN');

const db = parseUrl('DATABASE_URL');
const redis = parseUrl('REDIS_URL');
const dec = decodeURIComponent;

const config = {
  url,
  port: parseInt(env.PORT || '3000', 10),
  db: {
    host: db.hostname.replace(/^\[|\]$/g, ''),
    port: parseInt(db.port || '5432', 10),
    db: dec(db.pathname.replace(/^\//, '')),
    user: dec(db.username),
    pass: dec(db.password),
  },
  dbReplications: false,
  redis: {
    host: redis.hostname.replace(/^\[|\]$/g, ''),
    port: parseInt(redis.port || '6379', 10),
    family: 0,
    ...(redis.username && redis.username !== 'default' ? { username: dec(redis.username) } : {}),
    ...(redis.password ? { pass: dec(redis.password) } : {}),
  },
  fulltextSearch: { provider: 'sqlLike' },
  // The ID scheme can never change once the instance has data.
  id: 'aidx',
  clusterLimit: parseInt(env.MISSKEY_CLUSTER_LIMIT || '1', 10),
  // Railway's edge and private network reach the app from these ranges.
  trustProxy: [
    '10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16', '100.64.0.0/10',
    '127.0.0.1/32', '::1/128', 'fc00::/7',
  ],
  proxyBypassHosts: [
    'api.deepl.com', 'api-free.deepl.com', 'www.recaptcha.net',
    'hcaptcha.com', 'challenges.cloudflare.com',
  ],
};

if (env.SETUP_PASSWORD) config.setupPassword = env.SETUP_PASSWORD;
else console.warn('[railway] SETUP_PASSWORD is empty: anyone who opens the site first can create the admin account');

// Wait (up to 3 minutes) until Postgres and Redis accept TCP connections, so the
// migration step doesn't fail while the databases are still starting.
const reachable = (host, port) => new Promise((resolve) => {
  const s = connect({ host, port });
  s.setTimeout(3000);
  s.once('connect', () => { s.destroy(); resolve(true); });
  s.once('timeout', () => { s.destroy(); resolve(false); });
  s.once('error', () => { s.destroy(); resolve(false); });
});
for (const [name, host, port] of [['Postgres', config.db.host, config.db.port], ['Redis', config.redis.host, config.redis.port]]) {
  const deadline = Date.now() + 180_000;
  while (!(await reachable(host, port))) {
    if (Date.now() > deadline) fail(`${name} at ${host}:${port} did not answer within 3 minutes`);
    console.log(`[railway] waiting for ${name} at ${host}:${port}`);
    await new Promise((r) => setTimeout(r, 2000));
  }
}

writeFileSync('/misskey/.config/default.yml', JSON.stringify(config, null, 2) + '\n');
console.log(`[railway] wrote config for ${url} (db ${config.db.host}:${config.db.port}, redis ${config.redis.host}:${config.redis.port})`);
