import { isBoolean, isValidString } from '@neoncoder/validator-utils';
import { TSetting } from './custom.types';

export const constructSettings = <T extends TSetting>(settings: T[]) => {
  const parsedSettings: { [key: string]: any } = {};
  settings.forEach((i: T) => {
    parsedSettings[i.name] = i[i.type];
  });
  return parsedSettings;
};

export const deconstructSettings = <T extends TSetting>(parsedSettings: { [key: string]: any }) => {
  const deconstructedSettings: Array<Partial<TSetting>> = [];
  Object.entries(parsedSettings).forEach(([key, value]) => {
    const isObject = (obj: any) => obj === Object(obj);
    const isArray = Array.isArray(value);
    const isObjectResult = !isArray && isObject(value);
    const isBooleanValue = isBoolean(value);
    const isNumber = Boolean(parseFloat(value)) || value === 0;
    const isString = isValidString(value) && !isNumber && !isBooleanValue && !isArray && !isObject;
    const isList = isArray && !isObjectResult && !isObject(value[0]);
    const isObjectList = isArray && isObject(value[0]);
    const setting: TSetting = {
      name: key,
      boolean: isBoolean(value),
      type: isObjectList
        ? 'objectList'
        : isObjectResult
          ? 'object'
          : isList
            ? 'list'
            : isNumber
              ? 'number'
              : isBooleanValue
                ? 'boolean'
                : 'string',
      list: isList ? value : null,
      object: isObjectResult ? value : null,
      string: isString ? value : null,
      number: isNumber ? value : null,
      objectList: isObjectList ? value : [],
    };
    deconstructedSettings.push(setting as T);
  });
  return deconstructedSettings;
};
