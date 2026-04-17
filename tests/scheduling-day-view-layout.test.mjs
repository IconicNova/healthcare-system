import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const filePath = path.resolve('src/app/globals.css');
const source = fs.readFileSync(filePath, 'utf8');

function runTest(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

runTest('day view removes FullCalendar right-side event gutter', () => {
  assert.match(
    source,
    /\.scheduling-calendar\s+\.fc-direction-ltr\s+\.fc-timegrid-col-events\s*\{[^}]*margin-right:\s*0\s*!important;/s,
    'expected scheduling calendar styles to remove the default right-side margin from time-grid event columns'
  );
});
