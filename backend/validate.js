#!/usr/bin/env node

/**
 * Backend Validation Script
 * Validates all Lambda handlers can be loaded without syntax errors
 */

const handlers = [
  'src/handlers/preSignup.js',
  'src/handlers/createTask.js',
  'src/handlers/getTasks.js',
  'src/handlers/getAssignedTasks.js',
  'src/handlers/updateTask.js',
  'src/handlers/assignTask.js',
  'src/handlers/closeTask.js',
  'src/handlers/notifications.js'
];

const utilities = [
  'src/utils/dynamodb.js',
  'src/utils/ses.js',
  'src/utils/auth.js',
  'src/shared/constants.js'
];

console.log('🔍 Validating Backend Code...\n');

let hasErrors = false;

console.log('📋 Lambda Handlers:');
for (const handler of handlers) {
  try {
    const module = require('./' + handler);
    const handlerName = handler.split('/').pop().replace('.js', '');
    
    // Check if handler function exists
    if (module.handler && typeof module.handler === 'function') {
      console.log(`✅ ${handlerName.padEnd(20)} - OK (handler exported)`);
    } else {
      console.log(`⚠️  ${handlerName.padEnd(20)} - WARNING (no handler export)`);
    }
  } catch (error) {
    console.log(`❌ ${handler.padEnd(20)} - FAILED`);
    console.log(`   Error: ${error.message}`);
    hasErrors = true;
  }
}

console.log('\n🔧 Utilities:');
for (const util of utilities) {
  try {
    const module = require('./' + util);
    const utilName = util.split('/').pop().replace('.js', '');
    const exportCount = Object.keys(module).length;
    console.log(`✅ ${utilName.padEnd(20)} - OK (${exportCount} exports)`);
  } catch (error) {
    console.log(`❌ ${util.padEnd(20)} - FAILED`);
    console.log(`   Error: ${error.message}`);
    hasErrors = true;
  }
}

console.log('\n📦 Dependencies:');
try {
  require('@aws-sdk/client-dynamodb');
  console.log('✅ @aws-sdk/client-dynamodb');
} catch (e) {
  console.log('❌ @aws-sdk/client-dynamodb - NOT INSTALLED');
  hasErrors = true;
}

try {
  require('@aws-sdk/lib-dynamodb');
  console.log('✅ @aws-sdk/lib-dynamodb');
} catch (e) {
  console.log('❌ @aws-sdk/lib-dynamodb - NOT INSTALLED');
  hasErrors = true;
}

try {
  require('@aws-sdk/client-ses');
  console.log('✅ @aws-sdk/client-ses');
} catch (e) {
  console.log('❌ @aws-sdk/client-ses - NOT INSTALLED');
  hasErrors = true;
}

try {
  require('@aws-sdk/util-dynamodb');
  console.log('✅ @aws-sdk/util-dynamodb');
} catch (e) {
  console.log('❌ @aws-sdk/util-dynamodb - NOT INSTALLED');
  hasErrors = true;
}

try {
  require('uuid');
  console.log('✅ uuid');
} catch (e) {
  console.log('❌ uuid - NOT INSTALLED');
  hasErrors = true;
}

console.log('\n' + '='.repeat(50));

if (hasErrors) {
  console.log('❌ Validation FAILED - Fix errors above');
  process.exit(1);
} else {
  console.log('✅ All validations PASSED');
  console.log('\n📊 Summary:');
  console.log(`   - ${handlers.length} Lambda handlers validated`);
  console.log(`   - ${utilities.length} utilities validated`);
  console.log(`   - 5 dependencies verified`);
  console.log('\n🚀 Backend is ready for deployment!');
  process.exit(0);
}
