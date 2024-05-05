import PocketBase from '@neoncoder/pocketbase';
import { TypedPocketBase } from './pocketbase.types';

let pb: TypedPocketBase;

export const setPocketBase = async (url: string) => {
  pb = new PocketBase(url) as TypedPocketBase;
};

export const getPocketBase = () => pb;

export type PocketBaseConnection = ReturnType<typeof getPocketBase>;
