import { gql } from "apollo-server";

export default gql`
  type Team {
    owner: User!
    members: [User!]!
    channels: [Channel!]!
  }

  type CreateTeamResponse {
    ok: Boolean!
    team: Team
    errors: [Error!]
  }

  type Query {
    getTeam(id: Int!): Boolean!
  }

  type Mutation {
    createTeam(name: String!): CreateTeamResponse!
  }
`;
