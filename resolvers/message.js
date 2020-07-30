import { PubSub, withFilter } from "apollo-server";
import { createWriteStream } from "fs";

import { formatErrors } from "../helpers/formatErrors";
import { requiresAuth } from "../util/permissions";
import pubsub from "../util/pubsub";
import { SERVER_FILES_URL } from "../constants/routes";

const NEW_CHANNEL_MESSAGE = "NEW_CHANNEL_MESSAGE";
// publish subscribe engine

export default {
  Subscription: {
    newChannelMessage: {
      // Get notified by pubsub engine when new message has been sent
      subscribe: withFilter(
        () => pubsub.asyncIterator([NEW_CHANNEL_MESSAGE]),
        (payload, { channelId }) => payload.channelId === channelId
      ),
    },
  },
  Query: {
    channelMessages: requiresAuth.createResolver(
      async (parent, { channelId, cursor }, { models, user }) => {
        const channel = await models.Channel.findOne(
          { where: { id: channelId } },
          { raw: true }
        );

        if (!channel.public) {
          const member = await models.PCMember.findOne(
            { where: { channelId, userId: user.id } },
            { raw: true }
          );
          if (!member) {
            throw new Error("Not Authorized");
          }
        }

        const options = {
          order: [["createdAt", "DESC"]],
          where: { channelId },
          limit: 15,
        };

        if (cursor && cursor !== "") {
          options.where.created_at = {
            [models.Sequelize.Op.lt]: cursor,
          };
        }

        const messages = await models.Message.findAll(options, { raw: true });

        return messages;
      }
    ),
  },
  Mutation: {
    sendMessage: async (parent, args, { models, user }) => {
      try {
        const messageData = args;

        if (args.file) {
          const file = await args.file;

          const { createReadStream, filename, mimetype } = file;
          const fileStream = createReadStream();

          fileStream.pipe(createWriteStream(`./uploadedFiles/${filename}`));

          messageData.filetype = mimetype;
          messageData.url = `${SERVER_FILES_URL}${filename}`;
        }

        const message = await models.Message.create({
          ...messageData,
          userId: user.id,
        });

        // Notify pubsub engine that message has been sent
        pubsub.publish(NEW_CHANNEL_MESSAGE, {
          channelId: args.channelId,
          newChannelMessage: message.dataValues,
        });

        return {
          ok: true,
          message,
        };
      } catch (err) {
        return {
          ok: false,
          errors: formatErrors(err, models),
        };
      }
    },
  },
  Message: {
    user: ({ user, userId }, args, { models }) => {
      if (user) {
        return user;
      }
      return models.User.findOne({ where: { id: userId } });
    },
    channel: ({ channelId }, args, { models }) =>
      models.Channel.findOne({ where: { id: channelId } }),
  },
};
