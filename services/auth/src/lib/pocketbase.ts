import PocketBase from 'pocketbase';

let pb: InstanceType<typeof PocketBase>;

export const setPocketBase = async (url: string) => {
  pb = new PocketBase(url);
};

export const getPocketBase = () => pb;

export type PocketBaseConnection = ReturnType<typeof getPocketBase>;
