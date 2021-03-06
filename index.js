import { ApolloServer } from "apollo-server";
import express from "express";
import { createServer } from "http";
import DataLoader from "dataloader";
import path from "path";
import { fileLoader, mergeTypes, mergeResolvers } from "merge-graphql-schemas";
import jwt from "jsonwebtoken";

import models from "./models";
import { refreshTokens } from "./util/auth";
import { channelBatcher } from "./util/batchFunctions";

// constants
const SECRET = "asdfnaiu12408u931kljd";
const SECRET2 = "asdfnaiu12asdfg3408u931kljd";

// schema merge
const typeDefs = mergeTypes(fileLoader(path.join(__dirname, "./schema")));

// resolvers merge
const resolvers = mergeResolvers(
  fileLoader(path.join(__dirname, "./resolvers"))
);

// apollo server initialization
const server = new ApolloServer({
  typeDefs,
  resolvers,
  subscriptions: {
    onConnect: async ({ token, refreshToken }, webSocket) => {
      // return data if websocket token is valid
      if (token && refreshToken) {
        try {
          const { user } = jwt.verify(token, SECRET);

          return { models, user, SECRET, SECRET2 };
        } catch (error) {
          const newTokens = await refreshTokens(
            token,
            refreshToken,
            models,
            SECRET,
            SECRET2
          );

          if (newTokens.token && newTokens.refreshToken) {
            return { models, user: newTokens.user, SECRET, SECRET2 };
          }
        }
        // return {}
        throw new Error("User is not authentificated");
      }
      // return {}
      throw new Error("Tokens are not valid");
    },
  },
  context: async ({ req, res, connection }) => {
    // check if type of connection is websocket and return
    if (connection) {
      return connection.context;
    }
    // http connection context
    const token = req.headers["x-token"];
    let channelLoader;
    try {
      // verifying token
      const { user } = jwt.verify(token, SECRET);
      // DataLoader
      channelLoader = new DataLoader((ids) =>
        channelBatcher(ids, models, user)
      );
      return { models, user, SECRET, SECRET2, channelLoader };
    } catch (error) {
      // get refresh token
      const refreshToken = req.headers["x-refresh-token"];

      const newTokens = await refreshTokens(
        token,
        refreshToken,
        models,
        SECRET,
        SECRET2
      );

      // refresh token
      if (newTokens.token && newTokens.refreshToken) {
        res.set("Access-Control-Expose-Headers", "x-token", "x-refresh-token");
        res.set("x-token", newTokens.token);
        res.set("x-refresh-token", newTokens.refreshToken);
        // DataLoader
        channelLoader = new DataLoader((ids) =>
          channelBatcher(ids, models, newTokens.user)
        );
        return { models, user: newTokens.user, SECRET, SECRET2, channelLoader };
      }
      // token is unavailable
      return { models, user: null, SECRET, SECRET2 };
    }
  },
});
// express server for serving static content
const app = express();

app.use("./uploadedFiles", express.static("uploadedFiles"));
const staticFilesServer = createServer(app);

const main = async () => {
  try {
    // await models.sequelize.sync({force: !!process.env.TEST_DB});
    await models.sequelize.sync({});
    await server.listen().then(({ url, subscriptionsUrl }) => {
      // eslint-disable-next-line no-console
      console.log(`🚀  Server ready at ${url}`);
      // eslint-disable-next-line no-console
      console.log(`🚀  Subscriptions ready at ${subscriptionsUrl}`);

      staticFilesServer.listen(4001);
      console.log(`🚀  Static files ready http://localhost:4001/uploadedFiles`);
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
  }
};
main();
