import express from "express";
import cors from "cors";
import { createUsersTable } from "./models/user";
import { createOtpTable } from "./models/otp";
import locationRoutes from "./routes/locationRoutes";
import otpRoutes from "./routes/authRoutes";

const app = express();
app.use(cors());
app.use(express.json());
const port = 4000;

createUsersTable().then(() => console.log("Database setup complete"));
createOtpTable().then(() => console.log("Database setup complete"));

app.get("/", (req, res) => {
  res.status(200).json({
    msg: "Server is up and running from my end!",
  });
});

app.use("/auth", otpRoutes);
app.use('/location', locationRoutes);


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
