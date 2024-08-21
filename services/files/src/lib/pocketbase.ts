import PocketBase from '@neoncoder/pocketbase';
import { TypedPocketBase } from './pocketbase.types';
import { config } from '../config/config';

let pb: TypedPocketBase;
let adminPB: TypedPocketBase;
let rawPB: PocketBase;

export const setPocketBase = async () => {
  const {
    pocketbase: { url, adminEmail, adminPassword },
  } = config;
  pb = new PocketBase(url) as TypedPocketBase;
  adminPB = new PocketBase(url) as TypedPocketBase;
  rawPB = new PocketBase(url);
  pb.autoCancellation(false);
  adminPB.autoCancellation(false);
  await adminPB.admins.authWithPassword(adminEmail, adminPassword);
};

export const getPocketBase = (isAdmin = false) => (isAdmin ? adminPB : pb);
export const getRawPocketBase = () => rawPB;

export type PocketBaseConnection = ReturnType<typeof getPocketBase>;
