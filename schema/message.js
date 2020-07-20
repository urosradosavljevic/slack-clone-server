import { gql } from "apollo-server";

export default gql`
  scalar Date

  type Message {
    id: Int!
    text: String
    user: User!
    channel: Channel!
    createdAt: Date!
    url: String
    filetype: String
  }

  type Subscription {
    newChannelMessage(channelId: Int!): Message
  }

  type MessageResponse {
    ok: Boolean!
    message: Message
    errors: [Error!]
  }

  type Query {
    channelMessages(cursor: String!, channelId: Int!): [Message!]!
  }

  type Mutation {
    sendMessage(channelId: Int!, text: String, file: Upload): MessageResponse!
  }
`;
