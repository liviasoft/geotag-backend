import PocketBase from 'pocketbase';
import { TypedPocketBase } from './pocketbase.types';

// let pb: InstanceType<typeof PocketBase>;
let pb: TypedPocketBase;

export const setPocketBase = async (url: string) => {
  pb = new PocketBase(url) as TypedPocketBase;
};

export const getPocketBase = () => pb;

export type PocketBaseConnection = ReturnType<typeof getPocketBase>;
