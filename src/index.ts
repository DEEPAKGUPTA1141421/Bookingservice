import express from 'express';

const app = express();
const port = 4000;

// Basic route to check server
app.get('/', (req, res) => {
  res.status(200).json({
    msg:"Server is up and running from my end!"
  })
});
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
