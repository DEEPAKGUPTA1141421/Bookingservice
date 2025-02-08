import express from "express";
import cors from "cors";
import locationRoutes from "./routes/locationRoutes";
import otpRoutes from "./routes/authRoutes";
import { errorMiddleware } from "./config/CustomErrorhanlder";
const connectDb = require("./config/database");

const app = express();
app.use(errorMiddleware);
app.use(cors());
app.use(express.json());
const port = 4000;
connectDb();

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
