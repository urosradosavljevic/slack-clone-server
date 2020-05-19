import { gql } from "apollo-server";

export default gql`
  type Error {
    path: String!
    message: String!
  }
`;
