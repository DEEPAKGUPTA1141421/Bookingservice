import express from "express";
import cors from "cors";
import locationRoutes from "./routes/locationRoutes";
import otpRoutes from "./routes/authRoutes";
import AdminRoutes from "./routes/adminRoute";
import cartRoutes from "./routes/cartRoutes";
import ServiceRoutes from "./routes/serviceProviderRoutes"
import findProvider from "./routes/findProvider"
import { errorMiddleware } from "./config/CustomErrorhandler";
const connectDb = require("./config/database");
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const port = 4000;
connectDb();
app.get("/", (req, res) => {
  res.status(200).json({
    msg: "Server is up and running from my end!",
  });
});
app.use("/auth", otpRoutes);
app.use("/location", locationRoutes);
app.use("/admin", AdminRoutes);
app.use("/cart", cartRoutes);
app.use("/service-provider",ServiceRoutes)
app.use("/find-provider",findProvider);

app.use(errorMiddleware);
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
