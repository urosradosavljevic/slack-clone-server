import { gql } from "apollo-server";

export default gql`
  type Team {
    owner: User!
    members: [User!]!
    channels: [Channel!]!
  }

  type Query {
    getTeam(id: Int!): Boolean!
  }

  type Mutation {
    createTeam(name: String!): Boolean!
  }
`;
