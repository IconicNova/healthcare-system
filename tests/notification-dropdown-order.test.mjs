import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const filePath = path.resolve('src/components/notifications/NotificationDropdown.jsx');
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

runTest('notification callbacks are declared before effects depend on them', () => {
  const fetchUnreadCountDeclaration = source.indexOf('const fetchUnreadCount = useCallback');
  const fetchNotificationsDeclaration = source.indexOf('const fetchNotifications = useCallback');
  const notificationsEffectDependency = source.indexOf('}, [fetchNotifications, isOpen]);');
  const unreadCountEffectDependency = source.indexOf('}, [fetchUnreadCount]);');

  assert.notEqual(fetchUnreadCountDeclaration, -1, 'expected fetchUnreadCount declaration');
  assert.notEqual(fetchNotificationsDeclaration, -1, 'expected fetchNotifications declaration');
  assert.notEqual(notificationsEffectDependency, -1, 'expected notifications effect dependency');
  assert.notEqual(unreadCountEffectDependency, -1, 'expected unread count effect dependency');
  assert.ok(
    fetchNotificationsDeclaration < notificationsEffectDependency,
    'fetchNotifications must be declared before the effect that depends on it'
  );
  assert.ok(
    fetchUnreadCountDeclaration < unreadCountEffectDependency,
    'fetchUnreadCount must be declared before the effect that depends on it'
  );
});
