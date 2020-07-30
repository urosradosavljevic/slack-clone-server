import { formatErrors } from "../helpers/formatErrors";
import { requiresAuth } from "../util/permissions";

export default {
  Query: {
    teamMembers: requiresAuth.createResolver(
      async (parent, { teamId }, { models, user }) =>
        models.sequelize.query(
          `select * 
          from users as u join members as member on member.user_id = u.id 
          where member.team_id = ?`,
          {
            replacements: [teamId],
            model: models.User,
            raw: true,
          }
        )
    ),
  },
  Mutation: {
    createTeam: requiresAuth.createResolver(
      async (parent, args, { models, user }) => {
        try {
          const teamToAdd = await models.Team.findOne(
            { where: { name: args.name } },
            { raw: true }
          );

          if (teamToAdd) {
            return {
              ok: false,
              errors: [
                {
                  path: "name",
                  message: "Team with this name already exist",
                },
              ],
            };
          }

          const response = await models.sequelize.transaction(
            async (transaction) => {
              const team = await models.Team.create(
                { ...args },
                { transaction }
              );
              await models.Channel.create(
                {
                  name: "general",
                  public: true,
                  teamId: team.id,
                },
                { transaction }
              );
              await models.Member.create(
                {
                  teamId: team.id,
                  userId: user.id,
                  admin: true,
                },
                { transaction }
              );
              return team;
            }
          );

          return {
            ok: true,
            team: response,
          };
        } catch (err) {
          return {
            ok: false,
            errors: formatErrors(err, models),
          };
        }
      }
    ),
    createTeamMember: requiresAuth.createResolver(
      async (parent, { email, teamId }, { models, user }) => {
        try {
          const userToAddPromise = models.User.findOne(
            { where: { email } },
            { raw: true }
          );

          const memberToCheckPromise = models.Member.findOne(
            { where: { userId: user.id, teamId } },
            { raw: true }
          );

          const [userToAdd, memberToCheck] = await Promise.all([
            userToAddPromise,
            memberToCheckPromise,
          ]);

          if (!memberToCheck.admin) {
            return {
              ok: false,
              errors: [
                {
                  path: "email",
                  message: "You cannot add members to this team",
                },
              ],
            };
          }

          if (!userToAdd) {
            return {
              ok: false,
              errors: [
                {
                  path: "email",
                  message: "Could not find user with this email",
                },
              ],
            };
          }

          const memberExists = await models.Member.findOne(
            {
              where: {
                userId: userToAdd.id,
                teamId,
              },
            },
            { raw: true }
          );

          if (memberExists) {
            return {
              ok: false,
              errors: [
                {
                  path: "email",
                  message: "This user is already member of this team",
                },
              ],
            };
          }

          const member = await models.Member.create({
            userId: userToAdd.id,
            teamId,
          });

          return {
            ok: true,
            member,
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
  Team: {
    channels: async ({ id }, args, { channelLoader }) => channelLoader.load(id),
  },
};
