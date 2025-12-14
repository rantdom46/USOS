module.exports = {
    name: 'ping',
    description: 'Replies with Pong!',
    guildOnly: true,
    execute(interaction) {
        interaction.reply('Pong!');
    },
};
