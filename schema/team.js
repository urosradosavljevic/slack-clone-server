import { gql } from "apollo-server";

export default gql`
  type Team {
    id: Int!
    name: String!
    owner: Int!
    members: [User!]!
    channels: [Channel!]!
  }

  type CreateTeamResponse {
    ok: Boolean!
    team: Team
    errors: [Error!]
  }

  type VoidResponse {
    ok: Boolean!
    errors: [Error!]
  }

  type Query {
    getTeam(id: Int!): Boolean!
    allTeams: [Team!]!
    inviteTeams: [Team!]!
  }

  type Mutation {
    createTeam(name: String!): CreateTeamResponse!
    createTeamMember(email: String!, teamId: Int!): VoidResponse!
  }
`;
