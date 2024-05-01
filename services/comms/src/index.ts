import express from 'express';

const app = express();
app.use(express.json());
const port = 3002;

app.get('/', (req, res) => {
  res.send('Hello, TypeScript with Express!');
});

app.post('/api/v1/comms', (req, res) => {
  return res.status(200).send({ data: req.body });
});

app.get('/api/v1/comms', (req, res) => {
  console.log({ body: req.body, locals: res.locals });
  return res.send('This is from the comms service');
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
