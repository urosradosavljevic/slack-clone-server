import { gql } from "apollo-server";

export default gql`
  type Member {
    id: Int!
    email: String!
    username: String!
    teams: [Team!]!
  }
`;
