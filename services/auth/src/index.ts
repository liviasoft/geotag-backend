import { app } from './app';
import http from 'http';

const httpServer = http.createServer(app);
const PORT = 3000;

app.get('/', (req, res) => {
  res.send('Hello, TypeScript with Express!');
});

httpServer.listen(PORT, async () => {
  // await seedBankData();
  console.log(`API running on port ${PORT}`);
});
