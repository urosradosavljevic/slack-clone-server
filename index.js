import { ApolloServer } from "apollo-server";
import path from "path";
import { fileLoader, mergeTypes, mergeResolvers } from "merge-graphql-schemas";
import jwt from "jsonwebtoken";

// import typeDefs from "./schema/schema";
// import resolvers from "./resolvers/resolvers";
import models from "./models";
import { refreshTokens } from "./helpers/auth";

const SECRET = "asdfnaiu12408u931kljd";
const SECRET2 = "asdfnaiu12asdfg3408u931kljd";

const typeDefs = mergeTypes(fileLoader(path.join(__dirname, "./schema")));

const resolvers = mergeResolvers(
  fileLoader(path.join(__dirname, "./resolvers"))
);

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req, res }) => {
    const token = req.headers["x-token"];

    try {
      const { user } = jwt.verify(token, SECRET);

      return { models, user, SECRET, SECRET2 };
    } catch (error) {
      const refreshToken = req.headers["x-refresh-token"];

      const newTokens = await refreshTokens(
        token,
        refreshToken,
        models,
        SECRET,
        SECRET2
      );

      if (newTokens.token && newTokens.refreshToken) {
        res.set("Access-Control-Expose-Headers", "x-token", "x-refresh-token");
        res.set("x-token", newTokens.token);
        res.set("x-refresh-token", newTokens.refreshToken);
        return { models, user: newTokens.user, SECRET, SECRET2 };
      }
    }
  },
});

const main = async () => {
  try {
    await models.sequelize.sync({});
    await server.listen().then(({ url }) => {
      // eslint-disable-next-line no-console
      console.log(`🚀  Server ready at ${url}`);
    });
  } catch (err) {
    console.error(err);
  }
};
main();
