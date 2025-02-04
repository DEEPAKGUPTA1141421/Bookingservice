import express from 'express';
import { createUsersTable } from "./models/user";

const app = express();
const port = 4000;

createUsersTable().then(() => console.log("Database setup complete"));

app.get('/', (req, res) => {
  res.status(200).json({
    msg:"Server is up and running from my end!"
  })
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
