import express from "express";
import cors from "cors";
import { createUsersTable } from "./models/user";
import { createOtpTable } from "./models/otp";
import locationRoutes from "./routes/locationRoutes";
import otpRoutes from "./routes/authRoutes";
import { createServiceProvidersTable } from "./models/serviceprovider";
import { alterCategoriesTable, alterOtpTable, alterUserTable, createCategoriesTable, dbcall, insertCategories } from "./models/categoriesable";
import { createServicesTable } from "./models/service";

const app = express();
app.use(cors());
app.use(express.json());
const port = 4000;

// createUsersTable().then(() => console.log("Database setup complete"));  Done 
// createOtpTable().then(() => console.log("Database setup complete")); Done
// createServiceProvidersTable().then(() => console.log("Database setup complete")); DONE
//createCategoriesTable().then(() => console.log("Database setup complete")); Done
//insertCategories().then(()=>console.log("inserting the data into Category"))Done 
//dbcall().then(()=>console.log("we are fecthing")); Done

//alterCategoriesTable().then(()=>console.log("firing the alter"))
//alterOtpTable().then(()=>console.log("firing the alter"))
//alterUserTable().then(()=>console.log("firing the alter")))
//createServicesTable().then(()=>console.log("firing the alter"))); 

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
