import { gql } from "apollo-server";

export default gql`
  type User {
    id: Int!
    email: String!
    username: String!
    teams: [Team!]!
  }

  type Query {
    me: User!
    getUser(userId: Int!): User!
    allUsers: [User]!
  }

  type RegisterResponse {
    ok: Boolean!
    user: User
    errors: [Error!]
  }

  type LoginResponse {
    ok: Boolean!
    token: String
    refreshToken: String
    errors: [Error!]
  }

  type Mutation {
    register(
      username: String!
      email: String!
      password: String!
    ): RegisterResponse!
    login(email: String!, password: String!): LoginResponse!
  }
`;
