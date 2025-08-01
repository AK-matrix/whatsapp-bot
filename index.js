const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');

const ledgerFile = 'ledger.json';
const developer = '141180390113320@lid';

// Initialize or load ledger
let ledger;
if (fs.existsSync(ledgerFile)) {
    ledger = JSON.parse(fs.readFileSync(ledgerFile));
} else {
    ledger = {
        balances: {
            prithvi: 0,
            sidharth: 0,
            manish: 0,
            niranjan: 0,
            arun: 0,
            shubham: 0,
            arnavj: 0,
            arnavk: 0
        },
        logs: []
    };
    fs.writeFileSync(ledgerFile, JSON.stringify(ledger, null, 2));
}

function saveLedger() {
    fs.writeFileSync(ledgerFile, JSON.stringify(ledger, null, 2));
}

function parseLog(log) {
    if (log.startsWith('Split')) {
        const match = log.match(/Split (\d+) paid by (\w+) for (.+) \((.+)\)/);
        if (match) {
            return { type: 'split', amount: parseInt(match[1]), payer: match[2].toLowerCase(), names: match[3].split(', ').map(n=>n.toLowerCase()), reason: match[4] };
        }
    } else if (log.includes(' paid ')) {
        const match = log.match(/(\w+) paid (\w+) (\d+) for (.+)/);
        if (match) {
            return { type: 'pay', payer: match[1].toLowerCase(), receiver: match[2].toLowerCase(), amount: parseInt(match[3]), reason: match[4] };
        }
    }
    return null;
}

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
    const sender = msg.author || msg.from;

    // HELP
    if (text.startsWith('!help')) {
        await msg.reply(
`Commands:

!ping - Check if bot is online

!fkniru - Sends "FK NIRU" 5 times

@lamians - Tag everyone

!flip - Coin flip

!8ball <q> - Magic 8-Ball

!spam <count> <text> - Spam text (10+ only developer)

!split <amt> <payer> paid for <names> (reason) - Split money with payer credit

!<payer> pays <receiver> <amt> (reason) - Transfer money

!logs - Show transactions

!balance - Show balances

!resetledger - Reset balances and logs (developer)

!revert <n> - Revert last n transactions (developer)

!sticker (with image) - Make sticker (developer)`
        );
    }

    // PING
    if (text.startsWith('!ping')) {
        await msg.reply('Pong!');
    }

    // FKNIRU
    if (text.startsWith('!fkniru')) {
        let reply = '';
        for (let i = 0; i < 5; i++) reply += 'FK NIRU\n';
        await msg.reply(reply.trim());
    }

    // TAG ALL (@lamians)
    if (text.startsWith('@lamians') && msg.from.includes('@g.us')) {
        const chat = await msg.getChat();
        const mentions = chat.participants.map(p => p.id._serialized);
        let message = mentions.map(m => `@${m.split('@')[0]}`).join(' ');
        await chat.sendMessage(message, { mentions });
    }

    // FLIP
    if (text.startsWith('!flip')) {
        const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
        await msg.reply(`Coin flip result: ${result}`);
    }

    // 8BALL
    if (text.startsWith('!8ball')) {
        const responses = ['Yes','No','Maybe','Ask later','Definitely','Absolutely not','Without a doubt','Unlikely','100%','Try again'];
        await msg.reply(`🎱 ${responses[Math.floor(Math.random()*responses.length)]}`);
    }

    // SPAM
    if (text.startsWith('!spam')) {
        const parts = msg.body.split(' ');
        const count = parseInt(parts[1]);
        const spamText = parts.slice(2).join(' ');

        if (isNaN(count) || count < 1) {
            await msg.reply('Usage: !spam <count> <text>');
            return;
        }

        if (count > 10 && sender !== developer) {
            await msg.reply("You're not a developer");
            return;
        }

        for (let i = 0; i < Math.min(count, 50); i++) {
            await msg.reply(spamText);
        }
    }

    // SPLIT with payer credit logic
    if (text.startsWith('!split')) {
        const match = msg.body.match(/!split (\d+) (\w+) paid for (.+) \((.+)\)/i);
        if (!match) {
            await msg.reply('Usage: !split <amount> <payer> paid for <names> (reason)');
            return;
        }

        const amount = parseInt(match[1]);
        const payer = match[2].toLowerCase();
        const names = match[3].split(',').map(n => n.trim().toLowerCase());
        const reason = match[4];

        if (amount > 100 && sender !== developer) {
            await msg.reply("You're not a developer");
            return;
        }

        const perPerson = amount / names.length;

        // Add credit to payer (they covered total - their share)
        if (ledger.balances[payer] !== undefined) {
            ledger.balances[payer] += amount - perPerson;
        }

        // Subtract owed amounts from others (each owes their share)
        names.forEach(name => {
            if (name !== payer && ledger.balances[name] !== undefined) {
                ledger.balances[name] -= perPerson;
            }
        });

        ledger.logs.push(`Split ${amount} paid by ${payer} for ${names.join(', ')} (${reason})`);
        saveLedger();
        await msg.reply(`Split ${amount} paid by ${payer} for ${names.join(', ')} (${reason})`);
    }
    // PAY
    if (text.startsWith('!')) {
        const payMatch = msg.body.match(/!(\w+) pays (\w+) (\d+) \((.+)\)/i);
        if (payMatch) {
            const payer = payMatch[1].toLowerCase();
            const receiver = payMatch[2].toLowerCase();
            const amount = parseInt(payMatch[3]);
            const reason = payMatch[4];

            if (amount > 100 && sender !== developer) {
                await msg.reply("You're not a developer");
                return;
            }

            if (ledger.balances[payer] === undefined || ledger.balances[receiver] === undefined) {
                await msg.reply('Invalid payer or receiver name');
                return;
            }

            ledger.balances[payer] -= amount;
            ledger.balances[receiver] += amount;

            ledger.logs.push(`${payer} paid ${receiver} ${amount} for ${reason}`);
            saveLedger();
            await msg.reply(`${payer} paid ${receiver} ${amount} for ${reason}`);
        }
    }

    // LOGS
    if (text.startsWith('!logs')) {
        if (ledger.logs.length === 0) {
            await msg.reply('No transactions yet.');
        } else {
            await msg.reply('Logs:\n' + ledger.logs.join('\n'));
        }
    }

    // BALANCE
    if (text.startsWith('!balance')) {
        let reply = 'Balances (positive = credit, negative = owes money):\n\n';
        for (let m in ledger.balances) {
            reply += `${m}: ${ledger.balances[m]}\n`;
        }
        await msg.reply(reply.trim());
    }

    // RESET LEDGER (developer only)
    if (text.startsWith('!resetledger')) {
        if (sender !== developer) {
            await msg.reply("You're not a developer");
            return;
        }
        for (let m in ledger.balances) ledger.balances[m] = 0;
        ledger.logs = [];
        saveLedger();
        await msg.reply('Ledger has been reset.');
    }

    // REVERT LAST N TRANSACTIONS (developer only)
    if (text.startsWith('!revert')) {
        if (sender !== developer) {
            await msg.reply("You're not a developer");
            return;
        }

        const parts = text.split(' ');
        const count = parseInt(parts[1]);

        if (isNaN(count) || count < 1) {
            await msg.reply('Usage: !revert <number>');
            return;
        }

        if (count > ledger.logs.length) {
            await msg.reply('Not enough transactions to revert');
            return;
        }

        const logsToRevert = ledger.logs.splice(-count);

        for (let log of logsToRevert.reverse()) {
            const parsed = parseLog(log);
            if (parsed) {
                if (parsed.type === 'split') {
                    const perPerson = parsed.amount / parsed.names.length;

                    // Reverse payer credit
                    if (ledger.balances[parsed.payer] !== undefined) {
                        ledger.balances[parsed.payer] -= perPerson * (parsed.names.length - 1);
                    }

                    // Reverse participant debit
                    parsed.names.forEach(name => {
                        if (name !== parsed.payer && ledger.balances[name] !== undefined) {
                            ledger.balances[name] += perPerson;
                        }
                    });

                } else if (parsed.type === 'pay') {
                    if (ledger.balances[parsed.payer] !== undefined && ledger.balances[parsed.receiver] !== undefined) {
                        ledger.balances[parsed.payer] += parsed.amount; // refund payer
                        ledger.balances[parsed.receiver] -= parsed.amount; // remove from receiver
                    }
                }
            }
        }

        saveLedger();
        await msg.reply(`Reverted last ${count} transactions and updated balances.`);
    }

    // STICKER (developer only)
    if (text.startsWith('!sticker')) {
        if (sender !== developer) {
            await msg.reply("You're not a developer");
            return;
        }

        if (msg.hasMedia) {
            const media = await msg.downloadMedia();
            await msg.reply(media, undefined, { sendMediaAsSticker: true });
        } else {
            await msg.reply('Please send an image with !sticker command.');
        }
    }
});

client.initialize();
