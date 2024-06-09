import { $Enums, Prisma } from '@prisma/client';

export type TSerializedSpecialPermission = {
  [key: string]: {
    active: boolean;
    description: string | null;
    name: string;
  };
};

export type TSetting = {
  name: string;
  boolean: boolean | null;
  number: number | null;
  string: string | null;
  list: Prisma.JsonValue;
  object: Prisma.JsonValue;
  objectList: Prisma.JsonValue[];
  type: $Enums.DataType;
};
