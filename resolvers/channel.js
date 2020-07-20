import { formatErrors } from "../helpers/formatErrors";
import { requiresAuth } from "../helpers/permissions";

export default {
  Mutation: {
    getOrCreateDMChannel: requiresAuth.createResolver(
      async (parent, { members, teamId }, { models, user }) => {
        try {
          const member = await models.Member.findOne(
            { where: { teamId: teamId, userId: user.id } },
            { raw: true }
          );

          if (!member) {
            throw new Error("Not Authenticated");
          }

          const allMembers = [...members];
          allMembers.push(user.id);
          const [data, result] = await models.sequelize.query(
            `
        select c.id,c.name,c.dm,c.public
        from channels as c, pcmembers as pc
        where pc.channel_id= c.id and c.dm = true and c.public = false and c.team_id = ${teamId}
        group by c.id
        having array_agg(pc.user_id) @> Array[${allMembers.join(
          ","
        )}] and count(pc.user_id) = ${allMembers.length}`,
            { raw: true }
          );

          if (data.length) {
            return {
              ok: true,
              channel: data[0],
            };
          }

          const response = await models.sequelize.transaction(
            async (transaction) => {
              const users = await models.User.findAll({
                raw: true,
                where: { id: { [models.Sequelize.Op.in]: members } },
              });

              const channelName = users.map((u) => u.username).join(", ");
              console.log("channelName", channelName);
              const channel = await models.Channel.create(
                {
                  name: channelName,
                  members: allMembers,
                  teamId,
                  dm: true,
                  public: false,
                },
                {
                  transaction,
                }
              );
              if (allMembers) {
                const membersNew = allMembers.filter((m) => m !== user.id);
                membersNew.push(user.id);
                const pcmembers = membersNew.map((id) => ({
                  userId: id,
                  channelId: channel.id,
                }));

                await models.PCMember.bulkCreate(pcmembers, { transaction });
              }
              return channel;
            }
          );

          return {
            ok: true,
            channel: response.dataValues,
          };
        } catch (err) {
          console.log(err);
          return {
            ok: false,
            errors: formatErrors(err, models),
          };
        }
      }
    ),
    createChannel: requiresAuth.createResolver(
      async (parent, args, { models, user }) => {
        try {
          const member = models.Member.findOne(
            { where: { teamId: args.teamId, userId: user.id } },
            { raw: true }
          );

          if (member.admin) {
            return {
              ok: false,
              errors: [
                {
                  path: "name",
                  message:
                    "You have to be the owner of the team to create channels",
                },
              ],
            };
          }

          const response = await models.sequelize.transaction(
            async (transaction) => {
              const channel = await models.Channel.create(args, {
                transaction,
              });
              if (args.members && !args.public) {
                const members = args.members.filter((m) => m !== user.id);
                members.push(user.id);
                const pcmembers = members.map((id) => ({
                  userId: id,
                  channelId: channel.id,
                }));

                await models.PCMember.bulkCreate(pcmembers, { transaction });
              }
              return channel;
            }
          );

          return {
            ok: true,
            channel: response,
          };
        } catch (err) {
          return {
            ok: false,
            errors: formatErrors(err, models),
          };
        }
      }
    ),
  },
};
