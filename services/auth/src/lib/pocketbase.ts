import PocketBase from '@neoncoder/pocketbase';
import { TypedPocketBase } from './pocketbase.types';
import { config } from '../utils/config';

let pb: TypedPocketBase;
let adminPB: TypedPocketBase;

export const setPocketBase = async (url: string) => {
  pb = new PocketBase(url) as TypedPocketBase;
  adminPB = new PocketBase(url) as TypedPocketBase;
  await adminPB.admins.authWithPassword(config.pocketbase.adminEmail, config.pocketbase.adminPassword);
};

export const getPocketBase = (isAdmin = false) => (isAdmin ? adminPB : pb);

export type PocketBaseConnection = ReturnType<typeof getPocketBase>;
