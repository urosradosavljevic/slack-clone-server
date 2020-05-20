import _ from "lodash";

export const formatErrors = (e, models) => {
  if (e instanceof models.Sequelize.UniqueConstraintError) {
    const name = e.original.constraint.split("_")[1];
    return [
      {
        path: name,
        message: `User with this ${name} already exists.`,
      },
    ];
  }
  if (e instanceof models.Sequelize.ValidationError) {
    return e.errors.map((x) => _.pick(x, ["path", "message"]));
  }
  return [{ path: "name", message: "something went wrong" }];
};
