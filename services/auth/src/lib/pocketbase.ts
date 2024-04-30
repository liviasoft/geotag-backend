import PocketBase from 'pocketbase';

let pb: InstanceType<typeof PocketBase>;

export const setPB = async (url: string) => {
  pb = new PocketBase(url);
};

export const getPB = () => pb;

export type PocketBaseConnection = ReturnType<typeof getPB>;
