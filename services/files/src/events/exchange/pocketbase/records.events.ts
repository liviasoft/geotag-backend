import { USER_EVENTS } from './users.events';
import { APPSETTING_EVENTS } from './settings/appSettings.events';
import { USERSETTING_EVENTS } from './settings/userSettings.events';
import { LOCATION_EVENTS } from './locations.events';
import { LOCATIONTYPE_EVENTS } from './locationTypes.events';
import { CONTACT_EVENTS } from './contacts.events';
// import { MESSAGE_TEMPLATE_EVENTS } from './messageTemplates.events';

const collections = {
  APPSETTINGS: 'APPSETTINGS',
  USERSETTINGS: 'USERSETTINGS',
  USERS: 'USERS',
  MESSAGETEMPLATES: 'MESSAGETEMPLATES',
  LOCATIONS: 'LOCATIONS',
  LOCATIONTYPES: 'LOCATIONTYPES',
  CONTACTS: 'CONTACTS',
};

const recordsEventHandlers = {
  [collections.USERS]: USER_EVENTS,
  [collections.APPSETTINGS]: APPSETTING_EVENTS,
  [collections.USERSETTINGS]: USERSETTING_EVENTS,
  [collections.LOCATIONS]: LOCATION_EVENTS,
  [collections.LOCATIONTYPES]: LOCATIONTYPE_EVENTS,
  [collections.CONTACTS]: CONTACT_EVENTS,
  // [collections.MESSAGETEMPLATES]: MESSAGE_TEMPLATE_EVENTS,
};

export const RECORDS_EVENTS = async (message: any) => {
  const { data } = message;
  if (Object.keys(collections).includes(data.collection)) {
    console.log(`${data.collection} => ${data.action}`);
    await recordsEventHandlers[data.collection](message);
  }
};
