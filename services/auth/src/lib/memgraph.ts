import db, { Driver } from 'neo4j-driver';
import { config } from '../utils/config';

let driver: Driver;

// export const initGraphDriver = async (uri: string, username: string, password: string) => {
export const initGraphDriver = async () => {
  // driver = db.driver(uri, db.auth.basic(username, password));
  const uri = config.memgraph.uri;
  driver = db.driver(uri as string);
  const result = await driver.getServerInfo();
  console.log({ result });
  return driver;
};

export const getMemgraphDriver = () => driver;

export const closeDriver = () => driver && driver.close();
