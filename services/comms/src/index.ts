import express from 'express';

const app = express();
const port = 3001;

app.get('/', (req, res) => {
  res.send('Hello, TypeScript with Express!');
});

app.get('/api/v1/comms', (req, res) => {
  res.send('This is from the comms service');
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
