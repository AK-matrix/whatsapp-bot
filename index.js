const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');

const ledgerFile = 'ledger.json';
const developer = '141180390113320@lid';
var commandsEnabled = true;

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
    if (!msg.from.endsWith('@g.us') || !commandsEnabled) return;
    const text = msg.body.toLowerCase();
    const sender = msg.author || msg.from;
    console.log(text, sender);

    if (text.startsWith('!disable')) {
    if (sender !== developer) {
            await msg.reply("You're not a developer");
            return;
        }
    commandsEnabled = false;
    await msg.reply('⚠️ All commands have been disabled by admin.');
    return;
  }
  if (text.startsWith('!enable')) {
    if (sender !== developer) {
            await msg.reply("You're not a developer");
            return;
        }
    commandsEnabled = true;
    await msg.reply('✅ All commands have been re-enabled by admin.');
    return;
  }
  if((text === "!enable" || text === "!disable") && sender !== developer) {
    await msg.reply('You thought you could control me? Lmaooo');
    return;
  }

    // SPLIT with correct credit/debt logic (payer gains credit, others owe)
    if (text.startsWith('!split')) {
  // this regex now:
  // 1) captures the amount
  // 2) captures the payer
  // 3) captures one or more payees (anything up to an optional "(reason)")
  // 4) optionally captures a reason in parentheses
  const usage    = 'Usage: !split <amount> <payer> paid for <names> (reason)';
  const match    = msg.body.match(
    /^!split\s+(\d+)\s+(\w+)\s+paid\s+for\s+(.+?)(?:\s*\((.+)\))?$/i
  );
  if (!match) {
    await msg.reply(usage);
    return;
  }

  const amount  = parseFloat(match[1]);
  const payer   = match[2].toLowerCase();
  const rawList = match[3].trim();
  const reason  = match[4] || '';
  
  // split on comma and/or whitespace, then normalize
  const names = rawList
    .split(/[\s,]+/)
    .map(n => n.trim().toLowerCase())
    .filter(n => n.length > 0);
  
  // include the payer for the divisor
  const totalPeople = names.length + 1;
  const perPerson   = amount / totalPeople;
  
  // security check
  if (amount > 100 && sender !== developer) {
    await msg.reply("You're not a developer");
    return;
  }

  // calculate how much the payer “earns” back
  const creditToPayer = perPerson * names.length;

  // ensure balances exist
  ledger.balances[payer] = ledger.balances[payer] || 0;
  ledger.balances[payer] += creditToPayer.toFixed(2);

  // charge each other participant
  for (let name of names) {
    ledger.balances[name] = ledger.balances[name] || 0;
    ledger.balances[name] -= perPerson;
  }

  ledger.logs.push(
    `Split ${amount} paid by ${payer} for [${names.join(', ')}]` +
    (reason ? ` (${reason})` : '')
  );
  saveLedger();

  await msg.reply(
    `Split ₹${amount} (${names.length + 1} people). ` +
    `Each owes $${perPerson.toFixed(2)}. ` +
    `${payer} gets back $${creditToPayer.toFixed(2)}.`
  );
}


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

        if (count > 2 && sender !== developer) {
            await msg.reply("You're not a developer");
            return;
        }

        for (let i = 0; i < Math.min(count); i++) {
            await msg.reply(spamText);
        }
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
                            // match the original divisor:
                            const totalPeople = parsed.names.length + 1;
                            const perPerson   = parsed.amount / totalPeople;
                            // payer had collected everyone else's share:
                            const creditToPayer = perPerson * parsed.names.length;

                            // Reverse payer credit
                            if (ledger.balances[parsed.payer] !== undefined) {
                                ledger.balances[parsed.payer] -= creditToPayer;
                            }

                            // Reverse each participant’s debit
                            parsed.names.forEach(name => {
                                if (ledger.balances[name] !== undefined) {
                                ledger.balances[name] += perPerson;
                                }
                            });
                            }
                else if (parsed.type === 'pay') {
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

        if (msg.hasMedia) {
            const media = await msg.downloadMedia();
            await msg.reply(media, undefined, { sendMediaAsSticker: true });
        } else {
            await msg.reply('Please send an image with !sticker command.');
        }
    }
});

client.initialize();
