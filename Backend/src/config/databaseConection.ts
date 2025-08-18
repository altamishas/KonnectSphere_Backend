import mongoose from "mongoose";
import { config } from "./config";

const startDBConnection = async () => {
  try {
    mongoose.connection.on("connected", () => {
      console.log("Connected to Database Successfully");
    });
    mongoose.connection.on("error", (error) => {
      console.error("Connection to database Failed ", error);
    });

    await mongoose.connect(config.MONGO_URI as string);
  } catch (error) {
    console.error("Connection to database Failed Initially", error);
    process.exit(1);
  }
};
export default startDBConnection;
