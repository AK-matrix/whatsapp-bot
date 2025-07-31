const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ]
    }
});

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Bot is ready!');
});

client.on('message', async msg => {
    const text = msg.body.toLowerCase();

    // --- !ping ---
    if (text.startsWith('!ping')) {
        await msg.reply('Pong!');
    }

    // --- !help ---
    if (text.startsWith('!help')) {
        await msg.reply(
            `Commands:
!ping - Check if bot is online
!fkniru - Sends "FK NIRU" 5 times
@lamians - Tag everyone in group
!flip - Flip a coin (Heads/Tails)
!8ball <question> - Magic 8-Ball answer
!spam <count> <text> - Spam text multiple times (max 5)`
        );
    }

    // --- !fkniru ---
    if (text.startsWith('!fkniru')) {
        let reply = '';
        for (let i = 0; i < 5; i++) {
            reply += 'FK NIRU\n';
        }
        await msg.reply(reply.trim());
    }

    // --- @lamians (Tag everyone) ---
    if (text.startsWith('@lamians') && msg.from.includes('@g.us')) {
        const chat = await msg.getChat();

        if (!chat.isGroup) {
            await msg.reply('This command only works in groups.');
            return;
        }

        const mentions = [];
        let message = '';

        for (let participant of chat.participants) {
            mentions.push(participant.id._serialized);
            message += `@${participant.id.user} `;
        }

        await chat.sendMessage(message, { mentions });
    }

    // --- !flip (Coin flip) ---
    if (text.startsWith('!flip')) {
        const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
        await msg.reply(`Coin flip result: ${result}`);
    }

    // --- !8ball (Magic 8-Ball) ---
    if (text.startsWith('!8ball')) {
        const responses = [
            'Yes',
            'No',
            'Maybe',
            'Ask again later',
            'Definitely',
            'Absolutely not',
            'Without a doubt',
            'Unlikely',
            '100%',
            'Try again'
        ];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        await msg.reply(`🎱 ${randomResponse}`);
    }

    // --- !spam (Repeats text) ---
    if (text.startsWith('!spam')) {
        const parts = msg.body.split(' ');
        const count = parseInt(parts[1]);
        const spamText = parts.slice(2).join(' ');

        if (isNaN(count) || count < 1 || count > 5) {
            await msg.reply('Usage: !spam <count 1-5> <text>');
            return;
        }

        let reply = '';
        for (let i = 0; i < count; i++) {
            reply += `${spamText}\n`;
        }
        await msg.reply(reply.trim());
    }
});

client.initialize();
