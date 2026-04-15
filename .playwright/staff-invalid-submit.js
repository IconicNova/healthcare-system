async page => {
  const stamp = Date.now();
  const inputAfterLabel = label =>
    page.locator(`label:has-text("${label}")`).locator('xpath=following-sibling::*[1]//input');
  const selectAfterLabel = label =>
    page.locator(`label:has-text("${label}")`).locator('xpath=following-sibling::*[1][self::select]');

  await inputAfterLabel('First Name').fill('asdfasdfasdf');
  await inputAfterLabel('Last Name').fill('zzzzzzzzzz');
  await inputAfterLabel('Email').fill(`garbage.${stamp}@example.com`);
  await inputAfterLabel('Password').nth(0).fill('password123');
  await inputAfterLabel('Confirm Password').fill('password123');
  await inputAfterLabel('Phone').fill('4165550198');
  await selectAfterLabel('Branch').selectOption({ label: 'Atlanta Main Office' });
  await selectAfterLabel('Role').selectOption({ label: 'Staff' });
  await selectAfterLabel('Pay Type').selectOption({ label: 'Hourly' });
  await selectAfterLabel('Status').selectOption({ label: 'Active' });
  await inputAfterLabel('Pay Rate').fill('0');
  await page.getByRole('button', { name: 'Create Staff Member' }).click();
  await page.waitForLoadState('networkidle').catch(() => {});
  return await page.evaluate(() => document.body.innerText);
}
