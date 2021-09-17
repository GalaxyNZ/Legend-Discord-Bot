const fs = require('fs');
const ping = require('ping');
const Discord = require('discord.js');
const yt = require('ytdl-core');
const bot = new Discord.Client();
const config = require('./config.json');
const log = require('./log.json');

var svr = "";
var chn = "";

var hosts = ['gateway.discord.gg'];

//var Legend = "MzE5NTc4ODA1MTA4NzM2MDAy.DBC_cw.5qBs89EMLWae8rHIq2m8Yi8ppIs";

var Legend = "MjY0ODk5NTEyMDUxNTY0NTQ0.WGhA5Q.8QKi6z85-CzW7nGKDpv5uF7_l6w";

var slowedChannels = [];

let queue = {};

function saveDB() {
    fs.writeFile('./config.json', JSON.stringify(config), (err) => { if (err) console.error(err) });
    fs.writeFile('./log.json', JSON.stringify(log), (err) => { if (err) console.error(err) });

    console.log("    <database> Database saved");
}
function capitalize(string) {
    try {
        return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    } catch (err) {
        return string;
    }
}

function toTitleCase(str) {
    return str.replace(/\w\S*/g, function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
}

function roundNumber(rnum, rlength) {
    var newnumber = Math.round(rnum * Math.pow(10, rlength)) / Math.pow(10, rlength);
    return newnumber;
}

bot.on("guildMemberAdd", (member) => {
    var rand = Math.floor(Math.random() * config.bot.welcome.length);

    console.log(`   <system>   ${member.user.username} has joined ${member.guild.name}`);
    member.guild.defaultChannel.send(`Welcome to ${member.guild.name}, <@${member.user.id}>. ${config.bot.welcome[rand]}`);

    bot.users.get(member.id).send(`Hey there, welcome to ${member.guild.name}. I am ${bot.user.username}, the server bot. I have a bunch of simple commands to that you can use. If you want to know what they are, just use the ~help command. Make sure you brush up on the server functions and rules in the <#295146121410510848> channel. I hope you have a fantastic time with us and enjoy being here :slight_smile:`);

    member.addRole("255145992683257856");
});

bot.on("guildMemberRemove", (member) => {
    console.log(`   <system>   ${member.user.username} has left ${member.guild.name}`);

    member.guild.defaultChannel.send(`Adios <@${member.user.id}>. Thanks for being here`);
});

bot.on("message", msg => {

    var validCommand = true;

    let command = msg.content.split(" ")[0];
    command = command.slice(config.bot.prefix.length);

    let args = msg.content.split(" ").slice(1);

    command = command.toLowerCase();

    let prefix = config.bot.prefix;

    if (msg.channel.type == "dm") {
        dmchannel = true;
        // Sets the server and channel
        currentSvr = "DM Channel";
        currentChn = msg.author.id;
    } else {
        dmchannel = false;
        // Sets the server and channel
        currentSvr = msg.guild.name;
        currentChn = msg.channel.name;
    }

    if (!msg.content.startsWith(prefix)) return; // If the command doesn't start with a prefix, it will ignore it
    if (msg.author.bot) return; // If the command comes from a bot, it will ignore it

    // If channel or server have changed, it changes its value and prints it out
    if (svr != currentSvr) {
        svr = currentSvr;
        console.log();
        console.log(currentSvr.toUpperCase());
    }
    if (chn != currentChn) {
        chn = currentChn;
        console.log(" #" + currentChn);
    }

    // Sends the user a list of all commands
    if (command == "help") {
        var fileName = "help.txt";
        var data = fs.readFileSync(fileName);

        var fileName2 = "admincommands.txt";
        var adminhelp = fs.readFileSync(fileName2);

        bot.users.get(msg.author.id).send(data.toString());

        if (dmchannel == true) return;

        let member = msg.member;
        let admin = msg.guild.roles.find('name', 'Admin');

        if (member.roles.has(admin.id)) {
            bot.users.get(msg.author.id).send(adminhelp.toString());
        }

        msg.channel.send(":mailbox_with_mail:");

    }
    else if (command == "ping") {
        hosts.forEach(function (host) {
            ping.promise.probe(host)
                .then(function (res) {
                    if (res.time <= 100)
                        color = 65280;
                    if (res.time > 100 && res.time < 250)
                        color = 16750080;
                    if (res.time >= 250)
                        color = 16711680;

                    msg.channel.send({
                        embed: {
                            color: color,
                            author: {
                                name: `Ping request`,
                                icon_url: "http://i.imgur.com/ie4t7iP.png?1"
                            },
                            fields: [
                                {
                                    name: 'Server',
                                    value: host
                                },
                                {
                                    name: 'time',
                                    value: res.time + " ms"
                                }
                            ],
                            timestamp: new Date(),
                            footer: {
                                icon_url: msg.author.avatarURL,
                                text: `Requested by ${msg.author.username}`
                            }
                        }
                    }).then(msg => setTimeout(function () {
                        msg.delete();
                    }, 30000));
                });
        });
        setTimeout(function () {
            msg.delete();
        }, 30000)
    }
    else if (config.response[command])
        msg.channel.send(config.response[command]);

    // ------- MODERATING COMMANDS ------- //
    // Allows Admins to change the prefix
    else if (command == "prefix") {
        if (dmchannel == true) return;

        var permission = false;
        let member = msg.member;
        let admin = msg.guild.roles.find('name', 'Admin');
        if (member.roles.has(admin.id)) {
            permission = true;
        }

        if (!permission) return msg.channel.send("The prefix is " + config.bot.prefix);

        config.bot.prefix = args[0];

        //Saves the file
        saveDB();

        msg.channel.send("Prefix set to " + args[0]);
    }
    // Allows Admins, Owners or Moderators to post a message using the bot
    else if (command == "echo") {
        if (dmchannel == true) return;

        var permission = false;

        let member = msg.member;
        let admin = msg.guild.roles.find('name', 'Admin');
        //let guest = msg.guild.roles.find('name', 'Special Guests');
        //let mod = msg.guild.roles.find('name', 'Moderators');

        if (member.roles.has(admin.id)/* || member.roles.has(guest.id) || member.roles.has(mod.id)*/) {
            permission = true;
        }

        if (!permission) return msg.delete();


        try {
            msg.delete();
        }
        catch (err) {
            msg.channel.send("An error occured. Please contact <@225081792292454403> with a screenshot of this message and the command you sent.");
        }

        msg.channel.send(msg.content.slice(5));

    }
    // Warns a user... ADD LOGS
    else if (command == "warn") {
        if (dmchannel == true) return;

        var permission = false;

        let author = msg.member;
        let admin = msg.guild.roles.find('name', 'Admin');
        //let guest = msg.guild.roles.find('name', 'Special Guests');
        //let mod = msg.guild.roles.find('name', 'Moderators');

        if (author.roles.has(admin.id)/* || author.roles.has(guest.id) || author.roles.has(mod.id)*/) {
            permission = true;
        }

        if (!permission) return msg.delete();

        if (msg.mentions.users.size === 0)
            return msg.channel.send("You need to specify the user!");

        let member = msg.guild.member(msg.mentions.users.first());

        if (!member)
            return msg.channel.send("The user doesn't exist!");

        if (member.roles.has(admin.id)/* || author.roles.has(guest.id) || author.roles.has(mod.id)*/) {
            return msg.channel.send("You cannot warn a Moderator!");
        }

        let message = "";

        for (var i = 1; i < args.length; i++)
            message += args[i] + " ";

        if (args[2] == null)
            message = "No reason given";

        msg.delete();

        msg.channel.send(member + " has been warned!");

        let cnl = bot.channels.get('248732903591247882');

        cnl.send({
            embed: {
                color: 16711680,
                author: {
                    name: `Warning - ${member.displayName} (${member.id})`,
                    icon_url: "https://i.imgur.com/jYbPpyA.png"
                },
                fields: [
                    {
                        name: 'Reason',
                        value: message
                    },
                    {
                        name: 'Channel',
                        value: "#" + msg.channel.name
                    }
                ],
                timestamp: new Date(),
                footer: {
                    icon_url: msg.author.avatarURL,
                    text: `Warned by ${msg.author.username}`
                }
            }
        });

        memberID = member.id;
        if (!log[member.id]) {
            var information = [
            ]

            log[member.id] = information;
        }
        log[member.id].push(
            [
                "Warning",
                "Date",
                msg.channel.name,
                message
            ]
        )

        saveDB();

        if (args[2] == null)
            bot.users.get(member.id).send(`You have been warned in ${member.guild.name}!`);
        else
            bot.users.get(member.id).send(`You have been warned in ${member.guild.name}! Reason: ${message}`);
    }
    // Kicks a user
    else if (command == "kick") {
        if (dmchannel == true) return;

        var permission = false;

        let author = msg.member;
        let admin = msg.guild.roles.find('name', 'Admin');
        //let mod = msg.guild.roles.find('name', 'Moderators');

        if (author.roles.has(admin.id)/* || author.roles.has(mod.id)*/) {
            permission = true;
        }

        if (!permission) return msg.delete();

        if (msg.mentions.users.size === 0)
            return msg.channel.send("You need to specify the user!");

        let member = msg.guild.member(msg.mentions.users.first());

        if (!member)
            return msg.channel.send("The user doesn't exist!");

        if (member.roles.has(admin.id)/* || author.roles.has(guest.id) || author.roles.has(mod.id)*/) {
            return msg.channel.send("You cannot kick a Moderator!");
        }

        let message = "";

        for (var i = 1; i < args.length; i++)
            message += args[i] + " ";

        if (args[2] == null)
            message = "No reason given";

        msg.delete();

        member.kick();

        msg.channel.send(member + " has been kicked!");

        let cnl = bot.channels.get('248732903591247882');

        cnl.send({
            embed: {
                color: 16711680,
                author: {
                    name: `Kicked - ${member.displayName} (${member.id})`,
                    icon_url: "https://i.imgur.com/CA77qHa.png"
                },
                fields: [
                    {
                        name: 'Reason',
                        value: message
                    },
                    {
                        name: 'Channel',
                        value: "#" + msg.channel.name
                    }
                ],
                timestamp: new Date(),
                footer: {
                    icon_url: msg.author.avatarURL,
                    text: `Kicked by ${msg.author.username}`
                }
            }
        });

        memberID = member.id;
        if (!log[member.id]) {
            var information = [
            ]

            log[member.id] = information;
        }
        log[member.id].push(
            [
                "Kicked",
                "Date",
                msg.channel.name,
                message
            ]
        )

        saveDB();

        if (args[2] == null)
            bot.users.get(member.id).send(`You have been kicked from ${member.guild.name}!`);
        else
            bot.users.get(member.id).send(`You have been kicked from ${member.guild.name}! Reason: ${message}`);

    }
    // Bans a user
    else if (command == "ban") {
        if (dmchannel == true) return;

        var permission = false;

        let author = msg.member;
        let admin = msg.guild.roles.find('name', 'Admin');
        //let mod = msg.guild.roles.find('name', 'Moderators');

        if (author.roles.has(admin.id)/* || author.roles.has(mod.id)*/) {
            permission = true;
        }

        if (!permission) return msg.delete();

        if (msg.mentions.users.size === 0)
            return msg.channel.send("You need to specify the user!");

        let member = msg.guild.member(msg.mentions.users.first());

        if (!member)
            return msg.channel.send("The user doesn't exist!");

        if (member.roles.has(admin.id)/* || author.roles.has(guest.id) || author.roles.has(mod.id)*/) {
            return msg.channel.send("You cannot ban a Moderator!");
        }

        let message = "";

        for (var i = 3; i < args.length; i++)
            message += args[i] + " ";

        if (args[3] == null)
            message = "No reason given";

        msg.delete();

        msg.channel.send(member + " has been banned!");

        time = args[1];

        if (time == undefined)
            time = 1;

        let cnl = bot.channels.get('248732903591247882');

        cnl.send({
            embed: {
                color: 16711680,
                author: {
                    name: `BANNED - ${member.displayName} (${member.id})`,
                    icon_url: "http://i.imgur.com/F26kCtv.png?1"
                },
                fields: [
                    {
                        name: 'Reason',
                        value: message
                    },
                    {
                        name: 'Channel',
                        value: "#" + msg.channel.name
                    },
                    {
                        name: 'Time',
                        value: time + " days"
                    }
                ],
                timestamp: new Date(),
                footer: {
                    icon_url: msg.author.avatarURL,
                    text: `Banned by ${msg.author.username}`
                }
            }
        });

        roundNumber(time, 0);
        time = ((((time * 24) * 60) * 60) * 1000);

        if (args[2] == null)
            bot.users.get(member.id).send(`You have been banned from ${member.guild.name}!`);
        else
            bot.users.get(member.id).send(`You have been banned from ${member.guild.name}! Reason: ${message}`);

        nickname = member.displayName;

        console.log(`    <banned>   ${nickname} has been BANNED for ${args[1]} days. Reason: ${message}`)

        memberID = member.id;
        if (!log[member.id]) {
            var information = [
            ]

            log[member.id] = information;
        }
        log[member.id].push(
            [
                `BANNED for ${args[1]} days`,
                "Date",
                msg.channel.name,
                message
            ]
        )

        saveDB();

        member.ban({ days: 1, reason: message });
        if (time != 0) {
            setTimeout(function () {
                msg.guild.unban(member.id);
                console.log(`    <unban>    ${nickname} unbanned`);
            }, time);
        }
    }
    // View the logs of a user
    else if (command == "logs") {
        if (dmchannel == true) return;

        var permission = false;

        let author = msg.member;
        let admin = msg.guild.roles.find('name', 'Admin');
        //let mod = msg.guild.roles.find('name', 'Moderators');

        if (author.roles.has(admin.id)/* || author.roles.has(mod.id)*/) {
            permission = true;
        }

        if (!permission) return msg.delete();

        if (msg.mentions.users.size === 0)
            return msg.channel.send("You need to specify the user!");

        let member = msg.guild.member(msg.mentions.users.first());

        if (!member)
            return msg.channel.send("The user doesn't exist!");

        if (!log[member.id]) return msg.channel.send("User has no logs");

        var logsAgainstUser = log[member.id];

        var display = "";

        for (var i = 0; i < logsAgainstUser.length; i++) {
            logsAgainstUser2 = logsAgainstUser[i]
            display += `__${logsAgainstUser2[0]}__ \n  ${logsAgainstUser2[1]} - ${logsAgainstUser2[3]} \n`;
        }


        msg.channel.send(`**Logs for ${member.displayName}** - ${member.id} \n ${display}`)

    }
    // Allows an Owner, Admin or Moderator to add or remove automated responses
    else if (command == "sudo") {
        if (dmchannel == true) return;

        var permission = false;

        let author = msg.member;
        let admin = msg.guild.roles.find('name', 'Admin');
        //let guest = msg.guild.roles.find('name', 'Special Guests');
        //let mod = msg.guild.roles.find('name', 'Moderators');

        if (author.roles.has(admin.id)/* || author.roles.has(guest.id) || author.roles.has(mod.id)*/) {
            {
                permission = true;
            }

            if (!permission) return;

            var input = args[2];

            if (args[0] == "add") {
                var message = "";
                var space = " ";

                for (var i = 3; i < args.length; i++) {
                    if (i == args.length - 1)
                        space = "";
                    message += args[i] + space;
                }

                if (args[1] == "command") {

                    input = input.toLowerCase();
                    config.response[input] = message;

                    msg.channel.send(`The **${input}** command has been succesfully added!`);
                    console.log(`    <added>    ${input} (command)`);
                }
                if (args[1] == "link") {

                    input = input.toLowerCase();
                    config.links[input] = message;

                    msg.channel.send(`The **${input}** link has been succesfully added!`);
                    console.log(`    <added>    ${input} (link)`);
                }
                if (args[1] == "banned") {
                    input = input.toLowerCase();
                    config.banned[input] = input;

                    try {
                        msg.delete();
                    }
                    catch (err) {
                        msg.channel.send("An error occured. Please contact <@225081792292454403> with a screenshot of this message and the command you sent.");
                    }

                    msg.channel.send(`That word has been **BANNED**!!!`);
                    console.log(`    <added>    ${input} (BANNED)`);
                }
            }
            else if (args[0] == "remove") {
                if (args[1] == "command") {
                    delete config.response[input];

                    msg.channel.send(`The **${input}** command has been succesfully removed!`);
                    console.log(`    <removed>  ${input} (command)`);
                }
                if (args[1] == "link") {
                    delete config.links[input];

                    msg.channel.send(`The **${input}** link has been succesfully removed!`);
                    console.log(`    <removed>  ${input} (link)`);
                }
                if (args[1] == "banned") {
                    input = input.toLowerCase();

                    delete config.banned[input];

                    msg.channel.send(`**${input}** has been **UNBANNED**!`);
                    console.log(`    <removed>  ${input} (UNBANNED)`);
                }
            }
            else
                return msg.channel.send("The parameter is not valid, use `add/remove`!");

            saveDB();

        }
    }
    // Evaluates a piece of code
    else if (command == "eval") {
        msg.delete();
        if (msg.author.id != "225081792292454403") return;
        try {
            var code = args.join(" ");
            var evaled = eval(code);

            if (typeof evaled !== "string")
                evaled = require("util").inspect(evaled);

            msg.channel.send('```' + clean(evaled) + '```');
        }
        catch (err) {
            msg.channel.send(`\`ERROR\` \`\`\`x1\n${clean(err)}\n\`\`\``);
        }

    }
    // Private messages a user
    else if (command == "pm") {
        if (dmchannel == true) return;

        var permission = false;

        let author = msg.member;
        let admin = msg.guild.roles.find('name', 'Admin');
        //let guest = msg.guild.roles.find('name', 'Special Guests');
        //let mod = msg.guild.roles.find('name', 'Moderators');

        if (author.roles.has(admin.id)/* || author.roles.has(guest.id) || author.roles.has(mod.id)*/) {
            permission = true;
        }

        if (!permission) return;

        try {
            msg.delete();
        }
        catch (err) {
            msg.channel.send("An error occured. Please contact <@225081792292454403> with a screenshot of this message and the command you sent.");
        }

        if (msg.mentions.users.size === 0)
            return msg.channel.send("You need to specify the user!");

        let member = msg.guild.member(msg.mentions.users.first());

        if (!member)
            return msg.channel.send("The user doesn't exist!");

        let message = "";

        for (var i = 1; i < args.length; i++)
            message += args[i] + " ";

        msg.channel.send("PM sent");

        bot.users.get(member.id).send(message);
    }
    // Removes the last X messages
    else if (command == "purge") {
        if (dmchannel == true) return;

        var permission = false;

        let author = msg.member;
        let admin = msg.guild.roles.find('name', 'Admin');
        //let guest = msg.guild.roles.find('name', 'Special Guests');
        //let mod = msg.guild.roles.find('name', 'Moderators');

        if (author.roles.has(admin.id)/* || author.roles.has(guest.id) || author.roles.has(mod.id)*/) {
            permission = true;
        }

        if (!permission) return;

        let member = msg.guild.member(msg.mentions.users.first());

        // get number of messages to prune
        let messagecount = parseInt(args[0]);
        // get the channel logs
        msg.channel.fetchMessages({
            limit: 100
        })
            .then(messages => {
                let msg_array = messages.array();
                // filter the message to only your own
                if (member)
                    msg_array = msg_array.filter(m => m.author.id === member.id);
                // limit to the requested number + 1 for the command message
                msg_array.length = messagecount + 1;
                // Has to delete messages individually. Cannot use `deleteMessages()` on selfbots.
                msg_array.map(m => m.delete().catch(console.error));
            });
    }
    else if (command == "slowmode") {
        if (dmchannel == true) return;

        var permission = false;

        let author = msg.member;
        let admin = msg.guild.roles.find('name', 'Admin');
        //let guest = msg.guild.roles.find('name', 'Special Guests');
        //let mod = msg.guild.roles.find('name', 'Moderators');

        if (author.roles.has(admin.id)/* || author.roles.has(guest.id) || author.roles.has(mod.id)*/) {
            permission = true;
        }

        if (!permission) return;

        var set = false;
        for (var i = 0; i < slowedChannels.length; i++) {
            if (msg.channel.id == slowedChannels[i]) {
                set = true;
                delete slowedChannels[i];
                msg.channel.send("Slowmode off!");
                return
            }
        }

        if (set == false) {
            slowedChannels.push(msg.channel.id);
            msg.channel.send("Slowmode ON!");
        }
    }


    // ------- HELP COMMANDS ------- //
    // Gives people a link
    else if (command == "link") {
        if (args[0] == null) {
            var linkLength = Object.keys(config.links).length;
            for (var i = 0; i < linkLength; i++) {
                var linkToAdd = Object.keys(config.links)[i];
                if (i == 0)
                    var link = capitalize(linkToAdd);
                else
                    link = ", " + link + capitalize(linkToAdd);
            }
            msg.channel.send("**Links** \n ```" + link + "```")
        }
        else if (config.links[args[0]]) {
            msg.channel.sendembed({
                color: 3447003,
                author: {
                    name: capitalize(args[0]),
                    icon_url: `https://www.google.com/s2/favicons?domain=${config.links[args[0]]}`,
                    url: config.links[args[0]]
                },
                description: config.links[args[0]]
            });
        }
        else
            msg.channel.send("Link is not avaliable. Contact a moderator if you would like to add a link");
    }

    // ------- ROLE COMMANDS ------- //
    // Gives users the role they desire
    else if (command == "join") {
        if (dmchannel == true) return;

        let member = msg.member;
        let frontier = msg.guild.roles.find('name', 'Frontier');
        let antaeus = msg.guild.roles.find('name', 'Antaeus');

        if (args[0] == "antaeus") {
            try {
                member.addRole(antaeus);
                member.removeRole(frontier);
                msg.channel.send(`Welcome to Antaeus, ${member.nickname}!`);
            }
            catch (err) {
                msg.channel.send("Roles could not be found");
            }
        }
        if (args[0] == "frontier") {
            try {
                member.addRole(frontier);
                member.removeRole(antaeus);
                msg.channel.send(`Welcome to Frontier, ${member.nickname}!`)
            }
            catch (err) {
                msg.channel.send("Roles could not be found");
            }
        }
        if (args[0] == "neutral") {
            try {
                member.removeRole(antaeus);
                member.removeRole(frontier); c
            }
            catch (err) {
                msg.channel.send("Roles could not be found");
            }
        }
    }

    // ------- FUN COMMANDS ------- //
    // Chooses a random option
    else if (command == "choose") {
        let argument = msg.content.split("|").slice(1);

        var choices = [];

        var x = 0;

        for (x in argument) {
            choices.push(argument[x]);
        }

        var randomNumber = Math.floor(Math.random() * choices.length + 1);


        msg.channel.send('I choose... ')
            .then(msg => msg.edit("I choose " + choices[randomNumber - 1]))
    }
    // Chooses a random option
    else if (command == "8ball") {
        var eightball = ["As I see it, yes", "Ask again later", "Better not tell you now", "Cannot predict now", "Concentrate and ask again", "Don’t count on it", "It is certain", "It is decidedly so", "Most likely", "My reply is no", "My sources say no", "Outlook good", "Outlook not so good", "Reply hazy, try again", "Signs point to yes", "Very doubtful", "Without a doubt", "Yes", "Yes, definitely", "You may rely on it."]

        var randomNumber = Math.floor(Math.random() * eightball.length + 1);

        msg.channel.send({
            embed: {
                color: 8388736,
                description: ":crystal_ball" + eightball[randomNumber - 1]
            }
        });
    }
    // Quizes the user with some TX trivia
    else if (command == "quiz") {

        guess = 0;

        let author = msg.member;
        var randomNumber = Math.floor(Math.random() * config.quiz.questions.length);

        msg.channel.send(config.quiz.questions[randomNumber]);

        let answerCollector = msg.channel.createCollector(m => m);
        answerCollector.on('collect', m => {
            answer = m.content.toLowerCase();
            answerCheck = config.quiz.answers[randomNumber];

            for (var i = 0; i < answerCheck.length; i++) {
                if (msg.author.bot) return;

                if (answer.indexOf(answerCheck[i]) >= 0) {
                    console.log(`    <quiz>     Correct Answer (${answerCheck[i]})`);
                    let answerer = m.member;
                    if (answerer.id != author.id) return;

                    msg.channel.send(":white_check_mark: Correct");
                    answerCollector.stop();
                }
                else {
                    let answerer = m.member;
                    if (answerer.id != author.id) return;
                    m.react("❌");
                    guess += 1;
                }

            }
            if (answer.indexOf("skip") >= 0) {
                msg.channel.send("Aww, that sucks :slight_frown:");
                answerCollector.stop();
            }
            if (guess == 3) {
                msg.channel.send(":x: Wrong. You have used up your three guesses.");
                answerCollector.stop();
            }
        });
    }
    // See who is playing the game of your choice
    else if (command == "whosplaying") {
        if (dmchannel == true) return;

        var playinggame = [];
        var playing = "";

        let game = "";

        for (var i = 0; i < args.length; i++) {
            game += args[i] + " ";
        }

        if (!args[0]) { game = "tanki x " }

        game = game.toLowerCase();
        game = game.slice(0, -1);

        const userlist = msg.guild.members.map(u => u.toString());

        for (var i = 0; i < userlist.length; i++) {
            userID = userlist[i].replace(/\D/g, '');
            let user = msg.guild.member(userID);
            if (user.presence.game) {
                if (user.presence.game.name.toLowerCase() == game) {
                    playinggame.push(userlist[i]);
                }
            }
        }

        if (playinggame.length == 1)
            msg.channel.send(`There is ${playinggame.length} person playing ${toTitleCase(game)} in this guild`);
        else
            msg.channel.send(`There are ${playinggame.length} people playing ${toTitleCase(game)} in this guild`);

        for (var i = 0; i < playinggame.length; i++) {
            playing = playing + playinggame[i] + " \n ";
        }
        if (playinggame.length > 0)
            bot.users.get(msg.author.id).send(`Users currently playing ${toTitleCase(game)} \n ${playing}`);
    }

    // ------- MUSIC COMMANDS ------- //
    else if (command == "play") {
        if (dmchannel == true) return;

        if (queue[msg.guild.id] === undefined) return msg.channel.send(`Add some songs to the queue first with ${config.bot.prefix}add`);
        if (queue[msg.guild.id].playing) return msg.channel.send('Already Playing');
        let dispatcher;
        queue[msg.guild.id].playing = true;

        (function play(song) {
            if (song === undefined) return msg.channel.send('Queue is empty :slight_frown:').then(() => {
                queue[msg.guild.id].playing = false;
                msg.member.voiceChannel.leave();
            });
            msg.member.voiceChannel.join();
            msg.channel.send(`:musical_note: Playing: **${song.title}** as requested by: **${song.requester}**`);
            const dispatcher = msg.guild.voiceConnection.playStream(yt(song.url, { audioonly: true }), { passes: 1 });
            console.log("   <music>    Playing " + song.title);
            let collector = msg.channel.createCollector(m => m);
            collector.on('collect', m => {
                if (m.content.startsWith(config.bot.prefix + 'pause')) {
                    let author = msg.member;
                    let dj = msg.guild.roles.find('name', 'Testers');
                    if (author.roles.has(dj.id)) {
                        permission = true;
                    }

                    if (!permission) return msg.channel.send("You do not have permission to pause");

                    msg.channel.send(':pause_button: Paused').then(() => { dispatcher.pause(); console.log("   <music>    Paused"); });
                } else if (m.content.startsWith(config.bot.prefix + 'resume')) {
                    msg.channel.send(':arrow_forward: Resumed').then(() => { dispatcher.resume(); console.log("   <music>    Resumed"); });
                } else if (m.content.startsWith(config.bot.prefix + 'skip')) {
                    let author = msg.member;
                    let dj = msg.guild.roles.find('name', 'Testers');
                    if (author.roles.has(dj.id)) {
                        permission = true;
                    }

                    if (!permission) return msg.channel.send("You do not have permission to skip");

                    msg.channel.send(':fast_forward: Skipped').then(() => { dispatcher.end(); console.log("   <music>    Skipped"); });
                } else if (m.content.startsWith(config.bot.prefix + 'time')) {
                    msg.channel.send(`:alarm_clock: Time: ${Math.floor(dispatcher.time / 60000)}:${Math.floor((dispatcher.time % 60000) / 1000) < 10 ? '0' + Math.floor((dispatcher.time % 60000) / 1000) : Math.floor((dispatcher.time % 60000) / 1000)}`);
                }
            });
            dispatcher.on('end', () => {
                collector.stop();
                play(queue[msg.guild.id].songs.shift());
            });
            dispatcher.on('error', (err) => {
                return msg.channel.send(':no_entry: Error: ' + err).then(() => {
                    collector.stop();
                    play(queue[msg.guild.id].songs.shift());
                });
            });
        })(queue[msg.guild.id].songs.shift());
    }
    else if (command == "add") {
        if (dmchannel == true) return;
        msg.channel.startTyping();
        let url = msg.content.split(' ')[1];
        if (url == '' || url === undefined) return msg.channel.send(`:bangbang: You must add a YouTube video url, or id after ${config.bot.prefix}add`);
        yt.getInfo(url, (err, info) => {
            if (err) return msg.channel.send(':no_entry: Invalid YouTube Link: ' + err);
            if (!queue.hasOwnProperty(msg.guild.id)) queue[msg.guild.id] = {}, queue[msg.guild.id].playing = false, queue[msg.guild.id].songs = [];
            queue[msg.guild.id].songs.push({ url: url, title: info.title, requester: msg.author.username });
            msg.channel.send(`:musical_score: Added **${info.title}** to the queue`);
            console.log(`   <music>    Added ${info.title} to the queue`);
            msg.channel.stopTyping();
        });
    }
    else if (command == "queue") {
        if (dmchannel == true) return;

        if (queue[msg.guild.id] === undefined) return msg.channel.send(`:bangbang: Add some songs to the queue first with ${config.bot.prefix}add`);
        let tosend = [];
        queue[msg.guild.id].songs.forEach((song, i) => { tosend.push(`${i + 1}. ${song.title} - Requested by: ${song.requester}`); });
        msg.channel.send(`**${msg.guild.name}'s Music Queue:** Currently **${tosend.length}** songs queued ${(tosend.length > 5 ? '*[Only next 5 shown]*' : '')}\n\`\`\`${tosend.slice(0, 5).join('\n')}\`\`\``);
    }

    // ------- HELPFUL COMMANDS ------- //
    // Tells the user the current time in UTC
    else if (command == "utcnow") {
        var d = new Date();
        var utcNow = new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds());
        var utcNow2 = Date.now();

        utcNow = utcNow.toUTCString();

        var month = new Array(12);
        month[0] = "January";
        month[1] = "February";
        month[2] = "March";
        month[3] = "April";
        month[4] = "May";
        month[5] = "June";
        month[6] = "July";
        month[7] = "August";
        month[8] = "September";
        month[9] = "October";
        month[10] = "November";
        month[11] = "December";

        var weekday = new Array(7);
        weekday[0] = "Sunday";
        weekday[1] = "Monday";
        weekday[2] = "Tuesday";
        weekday[3] = "Wednesday";
        weekday[4] = "Thursday";
        weekday[5] = "Friday";
        weekday[6] = "Saturday";

        var dateex = new Array(32);
        dateex[0] = "NA";
        dateex[1] = "1st";
        dateex[2] = "2nd";
        dateex[3] = "3rd";
        dateex[4] = "4th";
        dateex[5] = "5th";
        dateex[6] = "6th";
        dateex[7] = "7th";
        dateex[8] = "8th";
        dateex[9] = "9th";
        dateex[10] = "10th";
        dateex[11] = "11th";
        dateex[12] = "12th";
        dateex[13] = "13th";
        dateex[14] = "14th";
        dateex[15] = "15th";
        dateex[16] = "16th";
        dateex[17] = "17th";
        dateex[18] = "18th";
        dateex[19] = "19th";
        dateex[20] = "20th";
        dateex[21] = "21st";
        dateex[22] = "22nd";
        dateex[23] = "23rd";
        dateex[24] = "24th";
        dateex[25] = "25th";
        dateex[26] = "26th";
        dateex[27] = "27th";
        dateex[28] = "28th";
        dateex[29] = "29th";
        dateex[30] = "30th";
        dateex[31] = "31st";


        var meridian = "am";
        var hoursreal = "";

        if (d.getUTCHours() > 12) {
            meridian = "pm";
            hoursreal = d.getUTCHours() - 12;
        }
        else {
            hoursreal = d.getUTCHours();
        }

        msg.channel.send("UTC Time");
        msg.channel.send("`" + hoursreal + ":" + d.getUTCMinutes() + meridian + " on " + weekday[d.getUTCDay()] + ", " + dateex[d.getUTCDate()] + " " + month[d.getUTCMonth()] + " " + d.getUTCFullYear() + "`");

    }

    // ------- OWNER COMMANDS ------- //
    // Sends me the config file
    else if (command == "config") {
        if (msg.author.id == "225081792292454403") {
            permission = true;
        }

        if (!permission) return;

        bot.users.get(msg.author.id).sendFile("config.json");

        msg.channel.send(":mailbox_with_mail:");
    }
    else
        var validCommand = false;

    if (validCommand == true) {
        if (msg.channel.type == "text") {
            let member = msg.guild.member(msg.author.id);
            console.log(`  <command>  ${member.displayName} (${command})`);
        }
        else if (msg.channel.type == "dm") {
            console.log(`  <command>  DM Channel / ${msg.author.id} (${command})`);
        }
    }

}); //END MESSAGE HANDLER

bot.on("message", msg => {
    //if they aren't in the list, add them and wait 20 seconds before removing
    for (var i = 0; i < slowedChannels.length; i++) {
        if (msg.channel.id == slowedChannels[i]) {
            msg.channel.overwritePermissions(msg.author.id, { SEND_MESSAGES: false });

            setTimeout(function () {
                msg.channel.overwritePermissions(msg.author.id, { SEND_MESSAGES: true });
            }, 10000)
        }
    }
});

// ANti swearing system.
/*bot.on("message", msg => {
    let text = msg.content.split(" ");

    let message = "";

    for (var i = 0; i < text.length; i++)
        message += text[i] + " ";

    let args = msg.content.split(" ");

    for (var i = 0; i < args.length; i++)
        check += text[i];

    if (msg.channel.type == "text") {
        for (var i = 0; i < args.length; i++) {
            args[i] = args[i].toLowerCase();
            args[i] = args[i].replace(/[^A-Za-z]/g, '');

            // Checks if the user is using a banned word
            if (config.banned[args[i]]) {
                let member = msg.guild.member(msg.author.id);
                let cnl = bot.channels.get('248732903591247882');

                cnl.send({
                    embed: {
                        color: 16711680,
                        author: {
                            name: `Swearing - ${member.displayName} (${member.id})`,
                            icon_url: "https://i.imgur.com/jYbPpyA.png"
                        },
                        fields: [
                            {
                                name: 'Channel',
                                value: "#" + msg.channel.name
                            },
                            {
                                name: 'Message',
                                value: message
                            }
                        ],
                        timestamp: new Date(),
                        footer: {
                            icon_url: msg.author.avatarURL,
                            text: `Auto alert`
                        }
                    }
                });

                try {
                    msg.delete();
                    bot.users.get(msg.author.id).send("Don't swear mate");
                }
                catch (err) {
                    msg.channel.send("An error occured. Please contact <@225081792292454403> with a screenshot of this message and the command you sent. Also, please don't swear again, kthx :).");
                }

                console.log(`  <swearing> ${member.displayName} (${args[i]})`);

                return;
            }
        }
    }
});*/

bot.on("message", msg => {
    let text = msg.content.split(" ");

    let message = "";

    for (var i = 0; i < text.length; i++)
        message += text[i] + " ";

    let args = msg.content.split(" ");

    let check = "";
    for (var i = 0; i < args.length; i++)
        check += text[i];

    if (msg.channel.type == "text") {
            check = check.toLowerCase();
            //args[i] = args[i].replace(/[^A-Za-z]/g, '');

            // Checks if the user is using a banned word
        for (var i = 0; i < config.banned2.length; i++) {
            if (check.includes(config.banned2[i])) {
                let member = msg.guild.member(msg.author.id);
                let cnl = bot.channels.get('248732903591247882');
                
                cnl.send({
                    embed: {
                        color: 16711680,
                        author: {
                            name: `Swearing - ${member.displayName} (${member.id})`,
                            icon_url: "https://i.imgur.com/jYbPpyA.png"
                        },
                        fields: [
                            {
                                name: 'Channel',
                                value: "#" + msg.channel.name
                            },
                            {
                                name: 'Message',
                                value: message
                            }
                        ],
                        timestamp: new Date(),
                        footer: {
                            icon_url: msg.author.avatarURL,
                            text: `Auto alert`
                        }
                    }
                });

                try {
                    msg.delete();
                    bot.users.get(msg.author.id).send("Please keep the language clean. Thanks :slight_smile:");
                }
                catch (err) {
                    msg.channel.send("An error occured. Please contact <@225081792292454403> with a screenshot of this message and the command you sent. Also, please don't swear again, kthx :).");
                }

                console.log(`  <swearing> ${member.displayName} (${args[i]})`);

                return;
            }
        }
    }
});

// ON MESSAGE EDIT CHECK FOR BANNED WORDS
bot.on("messageUpdate", (oldmsg, newmsg) => {
    let text = newmsg.content.split(" ")[0];

    let args = newmsg.content.split(" ");

    if (newmsg.channel.type == "text") {
        for (var i = 0; i < args.length; i++) {
            args[i] = args[i].toLowerCase();
            args[i] = args[i].replace(/[^A-Za-z]/g, '');

            // Checks if the user is using a banned word
            if (config.banned[args[i]]) {
                try {
                    newmsg.delete();
                    bot.users.get(newmsg.author.id).send("Don't swear mate");
                }
                catch (err) {
                    newmsg.channel.send("An error occured. Please contact <@225081792292454403> with a screenshot of this message and the command you sent. Also, please don't swear again, kthx :).");
                }

                let member = newmsg.guild.member(newmsg.author.id);
                console.log(`  <swearing> ${member.displayName} (${args[i]})`);
            }
        }
    }
});

function clean(text) {
    if (typeof (text) === "string")
        return text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));
    else
        return text;
}

bot.on("disconnected", function () {
    // alert the console
    console.log(`Connection Status: DISCONNECTED
Attempting reconnection...`);

});

bot.on('ready', () => {
    console.log(`Connection Status: CONNECTED
Logged in as ${bot.user.username}`);
    bot.user.setGame("with fire");
});

bot.on('error', e => { console.error(e); })

console.log("Attempting to connect...")
bot.login(Legend).then().catch();