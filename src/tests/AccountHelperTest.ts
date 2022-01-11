import AccountHelper from "../backendUtils/helper/AccountHelper";

const adminAccountability = {admin: true, id: Math.random()};
const userAccountability = {admin: false};

test('Set a user to an admin', async () => {
  let newAccountability = AccountHelper.getAdminAccountability(userAccountability);
  expect(newAccountability.admin).toBeTruthy();
});

test('Keep an admin', async () => {
  let newAccountability = AccountHelper.getAdminAccountability(adminAccountability);
  expect(newAccountability.admin).toBeTruthy();
});

test('Dont change any other params', async () => {
  let newAccountability = AccountHelper.getAdminAccountability(adminAccountability);
  expect(JSON.stringify(newAccountability)).toBe(JSON.stringify(adminAccountability));
});
