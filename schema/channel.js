import { gql } from "apollo-server";

export default gql`
  type Channel {
    id: Int!
    name: String!
    public: Boolean!
    messages: [Message!]!
    members: [User!]!
  }

  type CreateChannelResponse {
    ok: Boolean!
    channel: Channel
    errors: [Error!]
  }

  type Mutation {
    createChannel(
      teamId: Int!
      name: String!
      members: [Int]
      public: Boolean = true
    ): CreateChannelResponse!
  }
`;
