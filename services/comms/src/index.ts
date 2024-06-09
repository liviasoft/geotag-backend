import { app } from './app';
import http from 'http';
import { config } from './utils/config';

const {
  self,
  // rabbitMQ: { url, exchange, queue },
  // pocketbase,
} = config;

const httpServer = http.createServer(app);
const PORT = self.port;

httpServer.listen(PORT, async () => {
  // await setChannel(url as string, queue as string, exchange as string);
  // await setPocketBase(pocketbase.url as string);
  // const pb = getPocketBase();
  // await pb.collection('users').subscribe(
  //   'jzd4ar37o0m2gkn',
  //   (data) => {
  //     console.log({ data });
  //   },
  //   {},
  // );
  // console.log({ result: result() });
  // const userPBService = new PBService('users');
  // await userPBService.subscribeToCollection({ options: { keepalive: true } });
  // const pb = getPocketBase();
  // let user: User;
  // try {
  //   user = await pb.collection("users").getOne("y7609xw17niss2cd", { expand: "roles" });
  //   console.log({ user });
  // } catch (error: any) {
  //   if (error instanceof ClientResponseError) {
  //     const result = myMap.get(error.status)!({});
  //     console.log({ result });
  //   }
  //   console.log(error instanceof ClientResponseError);
  //   console.log({ error });
  // }
  // const appSetting: Pick<AppSetting, 'name'> = {
  //   // name: 'TestSetting',
  //   // type: 'string',
  //   name: 'TestSetting',
  //   type: '',
  // };
  // console.log({ appSetting });
  // const newUser = await pb.collection('users').create({});
  // await initGraphDriver()
  // await writeTestData()
  // await queryTestData()
  // await queryTestDataAggregate()
  // await writeTestEvent()
  // await readTestEvents()
  // await initReverseProxy(app);
  // const channel = await rabbitMQConnect(config.rabbitMQ);
  // if (channel) setChannel(channel);
  // await serviceEvents(getChannel());
  console.log(`${self.name} API running on port ${PORT}`);
});
