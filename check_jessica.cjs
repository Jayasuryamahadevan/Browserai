const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'JessicaSpace');
const debugLog = path.join(__dirname, 'jessi_debug.log');

console.log('--- DIAGNOSTIC START ---');
try {
    if (!fs.existsSync(baseDir)) {
        console.log(`Creating ${baseDir}...`);
        fs.mkdirSync(baseDir, { recursive: true });
    } else {
        console.log(`${baseDir} exists.`);
    }

    const testFile = path.join(baseDir, 'test_diagnostic.txt');
    fs.writeFileSync(testFile, 'Hello from check script ' + new Date().toISOString());
    console.log(`Written to ${testFile}`);

    const content = fs.readFileSync(testFile, 'utf-8');
    console.log(`Read back: ${content}`);

    fs.appendFileSync(debugLog, `Diagnostic run successful at ${new Date().toISOString()}\n`);
    console.log(`Written to log ${debugLog}`);

} catch (e) {
    console.error('ERROR:', e.message);
}
console.log('--- DIAGNOSTIC END ---');
