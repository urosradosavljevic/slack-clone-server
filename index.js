import { ApolloServer } from "apollo-server";

import typeDefs from "./schema";
import resolvers from "./resolvers";
import models from "./models";

const server = new ApolloServer({ typeDefs, resolvers });

const main = async () => {
  try {
    await models.sequelize.sync();
    await server.listen().then(({ url }) => {
      // eslint-disable-next-line no-console
      console.log(`🚀  Server ready at ${url}`);
    });
  } catch (err) {
    console.error(err);
  }
};
main();
