import _ from "lodash";

export const formatErrors = (e, models) => {
  if (e instanceof models.Sequelize.UniqueConstraintError) {
    const name = e.original.constraint.split("_")[0];
    return [
      {
        path: name,
        message: `This ${name} already exists.`,
      },
    ];
  }
  if (e instanceof models.Sequelize.ValidationError) {
    return e.errors.map((x) => _.pick(x, ["path", "message"]));
  }
  console.error(e);
  console.error("errors", e.errors);
  return [{ path: "name", message: "something went wrong" }];
};
