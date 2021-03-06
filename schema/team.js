import { gql } from "apollo-server";

export default gql`
  type Team {
    id: Int!
    name: String!
    owner: Int!
    channels: [Channel!]!
    admin: Boolean
  }

  type CreateTeamResponse {
    ok: Boolean!
    team: Team
    errors: [Error!]
  }

  type TeamMemberResponse {
    ok: Boolean!
    member: Member
    errors: [Error!]
  }

  type Query {
    getTeam(id: Int!): Boolean!
    allTeams: [Team!]!
    inviteTeams: [Team!]!
    teamMembers(teamId: Int): [User]!
  }

  type Mutation {
    createTeam(name: String!): CreateTeamResponse!
    createTeamMember(email: String!, teamId: Int!): TeamMemberResponse!
  }
`;
