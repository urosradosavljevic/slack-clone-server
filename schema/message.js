import { gql } from "apollo-server";

export default gql`
  scalar Date

  type Message {
    id: Int!
    text: String!
    user: User!
    channel: Channel!
    createdAt: Date!
  }

  type Subscription {
    newChannelMessage(channelId: Int!): Message
  }

  type MessageVoidResponse {
    ok: Boolean!
    errors: [Error!]
  }

  type Query {
    channelMessages(channelId: Int!): [Message!]!
  }

  type Mutation {
    sendMessage(channelId: Int!, text: String!): MessageVoidResponse!
  }
`;
