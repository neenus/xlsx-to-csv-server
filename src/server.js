const http = require("http");
const app = require("./app");
const PORT = process.env.PORT || 1337;
const { connectDB, closeDB } = require("./config/db");

const server = http.createServer(app);

const startServer = async () => {
  await server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  process.on("SIGTERM", () => {
    server.close(async () => {
      try {
        await closeDB();
        console.log("Database connection closed");
      } catch (err) {
        console.error("Error closing database connection:", err);
        process.exit(1); // Exit the process with an error code 
      }
      console.log("Process terminated");
      process.exit(0); // Exit the process gracefully
    });
  });

  process.on("SIGINT", () => {
    server.close(async () => {
      try {
        await closeDB();
        console.log("Database connection closed");
      } catch (err) {
        console.error("Error closing database connection:", err);
        process.exit(1); // Exit the process with an error code
      }
      console.log("Process interrupted");
      process.exit(0); // Exit the process gracefully
    });
  });
};

// close server on unhandledRejection
process.on("unhandledRejection", err => {
  console.log("Unhandled rejection, closing DB and shutting down...");
  console.log(err.name, err.message);
  server.close(() => {
    closeDB();
    process.exit(1);
  });
});

startServer();
