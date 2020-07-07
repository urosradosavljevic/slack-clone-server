import { gql } from "apollo-server";

export default gql`
  type DirectMessage {
    id: Int!
    text: String!
    sender: User!
    receiver: User!
    createdAt: Date!
  }

  type Subscription {
    newDirectMessage(receiverId: Int!, teamId: Int!): DirectMessage
  }

  type Query {
    directMessages(receiverId: Int!, teamId: Int!): [DirectMessage!]!
  }

  type MessageResponse {
    ok: Boolean!
    errors: [Error!]
  }

  type Mutation {
    sendDirectMessage(
      receiverId: Int!
      teamId: Int
      text: String!
    ): MessageResponse!
  }
`;
