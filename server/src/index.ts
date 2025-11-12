import express from "express";
import cors from "cors";
import ec2Routes from "./routes/ec2";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/ec2", ec2Routes);

const PORT = 3001;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`Backend running on port ${PORT}`)
);
