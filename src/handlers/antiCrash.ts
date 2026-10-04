import { Client } from "discord.js";

module.exports = (client: Client) => {
  // console.error goes to stderr, which the log shipper (and the admin Logs page) treats as an error.
  process.on("unhandledRejection", (reason, p) => {
    console.error(" [antiCrash] :: Unhandled Rejection/Catch");
    console.error(reason, p);
  });
  process.on("uncaughtException", (err, origin) => {
    console.error(" [antiCrash] :: Uncaught Exception/Catch");
    console.error(err, origin);
  });
  process.on("uncaughtExceptionMonitor", (err, origin) => {
    console.error(" [antiCrash] :: Uncaught Exception/Catch (MONITOR)");
    console.error(err, origin);
  });
  //process.on('multipleResolves', (type, promise, reason) => {
  //console.log(' [antiCrash] :: Multiple Resolves');
  //console.log(type, promise, reason);
  //});
};
