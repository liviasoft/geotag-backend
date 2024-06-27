import { faker } from '@faker-js/faker';

export const fakerMessageDefaults = {
  USERNAME: faker.person.firstName(),
  OTP: faker.number.int({ min: 100000, max: 999999 }),
  TOKEN: faker.string.uuid(),
  ACTION_URL: faker.internet.url(),
  APP_NAME: faker.company.name(),
  APP_URL: faker.internet.url(),
  AMOUNT: faker.commerce.price(),
  CURRENCY: faker.finance.currency(),
  FEE: faker.commerce.price(),
  DATE: faker.date.recent(),
  DATE_TIME: faker.date.anytime(),
  TIME_TILL: '30 min',
};
