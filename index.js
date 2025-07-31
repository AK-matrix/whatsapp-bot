const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});


client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Bot is ready!');
});

client.on('message', async msg => {
    // Handle only commands starting with "!" or "@"
    const text = msg.body.toLowerCase();

    // Personal or group — both allowed
    if (text.startsWith('!ping')) {
        await msg.reply('Pong!');
    }

    if (text.startsWith('!help')) {
        await msg.reply('Commands:\n!ping - Check if bot is online\n@lamians - Tag everyone in group\n!fkniru - FK NIRU');
    }

    if (text.startsWith('!fkniru')) {
    let reply = '';
    for (let i = 0; i < 5; i++) {
        reply += 'FK NIRU\n';
    }
    await msg.reply(reply.trim());
}


    // @lamians command (GROUP ONLY)
    if (text.startsWith('@lamians') && msg.from.includes('@g.us')) {
        const chat = await msg.getChat();

        if (!chat.isGroup) {
            await msg.reply('This command only works in groups.');
            return;
        }

        // Fetch group participants
        const participants = chat.participants;
        const mentions = [];

        let message = '';
        for (let participant of participants) {
            mentions.push(participant.id._serialized);
            message += `@${participant.id.user} `;
        }

        // Send message tagging everyone
        await chat.sendMessage(message, { mentions });
    }
});

client.initialize();
