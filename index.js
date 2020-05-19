import { ApolloServer } from "apollo-server";
import path from "path";
import { fileLoader, mergeTypes, mergeResolvers } from "merge-graphql-schemas";

// import typeDefs from "./schema/schema";
// import resolvers from "./resolvers/resolvers";
import models from "./models";

const SECRET = "asdfnaiu12408u931kljd";
const SECRET2 = "asdfnaiu12asdfg3408u931kljd";

const typeDefs = mergeTypes(fileLoader(path.join(__dirname, "./schema")));

const resolvers = mergeResolvers(
  fileLoader(path.join(__dirname, "./resolvers"))
);

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: { models, user: { id: 1 }, SECRET, SECRET2 },
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
