const http = require("http");
const app = require("./app");
const PORT = process.env.PORT || 1337;

const server = http.createServer(app);

const startServer = async () => {
  await server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
