const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const base = path.resolve(__dirname);
console.log('cwd=' + process.cwd());
console.log('exists=' + fs.existsSync(path.join(base, '.env')));
if (fs.existsSync(path.join(base, '.env'))) {
  console.log(fs.readFileSync(path.join(base, '.env'), 'utf8'));
}
const env = dotenv.config({ path: path.join(base, '.env') });
console.log('parsed error=' + (env.error ? env.error.message : 'none'));
console.log('REDIS_URL=' + env.parsed?.REDIS_URL);
console.log('JWT_ACCESS_SECRET=' + (env.parsed?.JWT_ACCESS_SECRET ? 'present' : 'missing'));
console.log('JWT_REFRESH_SECRET=' + (env.parsed?.JWT_REFRESH_SECRET ? 'present' : 'missing'));
console.log('QR_HMAC_SECRET=' + (env.parsed?.QR_HMAC_SECRET ? 'present' : 'missing'));
