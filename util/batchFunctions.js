export const channelBatcher = async (ids, models, user) => {

  const results = await models.sequelize.query(
    `select distinct on (c.id) c.id,c.name,c.public,c.dm,c.team_id  
        from channels as c left outer join pcmembers as m on c.id = m.channel_id 
        where c.team_id in (:teamIds) and (c.public = true or m.user_id = :currentUserId)`,

    {
      replacements: { currentUserId: user.id, teamIds: ids },
      model: models.Channel,
      raw: true,
    }
  );

  const data = {};

    results.forEach((result) => {
      if (data[result.team_id]) {
        data[result.team_id].push(result);
      } else {
        data[result.team_id] = [result];
      }
    });
    

  return ids.map((id) => data[id]);
};
