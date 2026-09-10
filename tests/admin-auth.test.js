const assert = require('assert');
const fs = require('fs');
const path = require('path');
const adminAuth = require('../middlewares/adminAuth');
const { ADMIN_TOKEN } = adminAuth;

const apiSource = fs.readFileSync(path.join(__dirname, '../routes/api.js'), 'utf8');

assert.ok(apiSource.includes("router.get('/admin/stats', adminAuth"));
assert.ok(apiSource.includes("router.get('/admin/chat/:chatId', adminAuth"));
assert.ok(apiSource.includes("router.put('/admin/stats/:statId/estado', adminAuth"));

let denied = false;
adminAuth(
    { headers: {} },
    { status: function (code) { assert.strictEqual(code, 401); return { json: function () { denied = true; } }; } },
    function () { throw new Error('no debía pasar sin token'); }
);
assert.ok(denied);

let allowed = false;
adminAuth(
    { headers: { authorization: 'Bearer ' + ADMIN_TOKEN } },
    {},
    function () { allowed = true; }
);
assert.ok(allowed);

console.log('OK: las entrevistas ya no se pueden leer sin token de admin.');
