import { formatErrors } from "../helpers/formatErrors";

export default {
  Mutation: {
    createTeam: async (parent, args, { models, user }) => {
      try {
        const team = await models.Team.create({ ...args, owner: user.id });
        return {
          ok: true,
          team,
        };
      } catch (err) {
        return {
          ok: false,
          errors: formatErrors(err, models),
        };
      }
    },
  },
};
