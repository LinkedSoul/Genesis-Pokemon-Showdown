//There are a few things you'll need to add if you want to use this file. You need to change the makechatroom command so 
//that it resets the hangman status upon making a chatroom; otherwise trying to run hangman in the new room will crash 
//the server. Specifically, you'll need to add "hangman.reset(id)" somewhere in the code. Have fun! - piiiikachuuu

exports.hangman = function(h) {
    if (typeof h != "undefined") var hangman = h;
    else var hangman = new Object();
    var hangmanFunctions = {
        //reset hangman in the room - used once a round ends.
        reset: function(rid) {
            hangman[rid] = {
                givenguesses: 12,
                hangman: false,
                guessword: new Array(),
                hangmaner: new Array(),
                guessletters: new Array(),
                guessedletters: new Array(),
                guessedwords: new Array(),
                correctletters: new Array(),
                spaces: new Array(),
                hangmantopic: new Array(),
            };
        }
    };
    for (var i in hangmanFunctions) {
        hangman[i] = hangmanFunctions[i];
    }
    for (var i in Rooms.rooms) {
        if (Rooms.rooms[i].type == "chat" && !hangman[i]) {
            hangman[i] = new Object();
            hangman.reset(i);
        }
    }
    return hangman;
};

var cmds = {
    hh: 'hangmanhelp',
    hangmanhelp: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox(
            '<font size = 2>A brief introduction to </font><font size = 3>Hangman:</font><br />' +
            'El clásico juego, la idea básica del hangman es adivinar la palabra en la que alguien esta pensando antes de que el hombre sea "ahorcado". Los jugadores tienen 12 oportunidades antes de que esto pase.<br />' +
            'Los juegos pueden ser iniciados por Voice o rangos superiores incluyendo Room Voice, Room Mod, y Room Owner.<br />' +
            'Los comandos son:<br />' +
            '<ul><li>/hangman [palabra], [descripción] - Inicia el juego de hangman con la palabra especificada sobre un tema en específico Requiere: + % @ & ~</li>' +
            '<li>/guess [letter] - Adivina una letra..</li>' +
            '<li>/guessword [word] - Adivina una palabra.</li>' +
            '<li>/viewhangman - Muestra el estado actual del juego. Puede ser voceado.</li>' +
            '<li>/word - Permite a la persona que inició el juego ver la palabra.</li>' +
            '<li>/category [descripción] OR /topic [descripción] - Permite a la persona que inició el juego cambiar la descripción.</li>' +
            '<li>/endhangman - Finaliza el juego de hangman. Requiere: + % @ & ~</li></ul>' +
            'Diviertete y siéntete libre de mandar un MP si encuentras un bug en el juego - Darknage'
        );
    },

    hang: 'hangman',
    hangman: function(target, room, user) {
        if (target == "update" && this.can('hotpatch')) {
            CommandParser.uncacheTree('./hangman.js');
            hangman = require('./hangman.js').hangman(hangman);
            return this.sendReply('Los scripts de hangman fueron actualizados.');
        }
        if (target == "update" && !this.can('hotpatch')) {
            return this.sendReply('No puedes actualizar los scripts de hangman.');
        }
        if (!user.can('broadcast', null, room)) {
            return this.sendReply('No tienes la suficiente autoridad para hacer esto.');
        }
        if (hangman[room.id].hangman === true) {
            return this.sendReply('Ya hay un juego de hangman en curso.');
        }
        if (!target) {
            return this.sendReply('La forma correcta del comando es /hangman [palabra], [descripción]');
        }
        if (hangman[room.id].hangman === false) {
            var targets = target.split(',');
            if (!targets[1]) {
                return this.sendReply('Asegurate de incluir la descripción.');
            }
            if (targets[0].length > 10) {
                return this.sendReply('Como solo se permite intentar en 12 ocasiones, la palabra no puede ser demasiado larga.')
            }
            if (targets[0].indexOf(' ') != -1) {
                return this.sendReply('Por favor no uses espacios en la palabra a adivinar.');
            }
            if (targets[1].indexOf('<img ', '<a href', '<font ', '<marquee', '<blink', '<center', '<button', '<b', '<i') != -1) {
                return this.sendReply('Ha, ha, ha... piensas que HTMML funciona aqui?... HA!');
            }
            hangman.reset(room.id);
            hangman[room.id].hangman = true;
            var targetword = targets[0].toLowerCase();
            hangman[room.id].guessword.push(targetword);
            hangman[room.id].hangmaner.push(user.userid);
            for (var i = 0; i < targets[0].length; i++) {
                hangman[room.id].guessletters.push(targetword[i]);
                hangman[room.id].spaces.push('_');
                hangman[room.id].hangmantopic[0] = targets[1];
            }
            return this.add('|html|<div class = "infobox"><div class = "broadcast-green"><center><font size = 2><b>' + user.name + '</b> ha iniciado un juego de ahorcado. La palabra tiene ' + targets[0].length + ' letras.<br>' + hangman[room.id].spaces.join(" ") + '<br>La categoría: ' + hangman[room.id].hangmantopic[0] + '</font></center></div></div>');
        }
    },

    vh: 'viewhangman',
    viewhangman: function(target, room, user) {
        if (!this.canBroadcast()) return;
        if (hangman[room.id].hangman === false) {
            return this.sendReply('There is no game of hangman going on right now.');
        }
        this.sendReplyBox('<div class = "infobox"><div class = "broadcast-blue"><font size = 2 font color="black">' + hangman[room.id].spaces.join(" ") + '<br>Guesses left: ' + hangman[room.id].givenguesses + '<br>Category: ' + hangman[room.id].hangmantopic[0] + '</font>');
    },

    topic: 'category',
    category: function(target, room, user) {
        if (hangman === false) {
            return this.sendReply('No hay juego de hangman en curso.');
        }
        if (user.userid != hangmaner[0]) {
            return this.sendReply('No puedes cambiar la categoría debido a que no hay juego en curso.');
        }
        hangman[room.id].hangmantopic[0] = target;
        return this.sendReply('Cambiaste la categoría a \'' + target + '\'.');
    },

    word: function(target, room, user) {
        if (user.userid === hangman[room.id].hangmaner[0]) {
            return this.sendReply('La palabra es \'' + hangman[room.id].guessword[0] + '\'.');
        } else {
            return this.sendReply('No eres la persona que inició el juego.');
        }
    },
    gl: 'guess',
    g: 'guess',
    guess: function(target, room, user) {
        if (!this.canTalk()) return;
        if (hangman[room.id].hangman === false) {
            return this.sendReply('No hay juego de hangman en curso.');
        }
        if (user.userid === hangman[room.id].hangmaner[0]) {
            return this.sendReply('No puedes adivinar debido a que tu iniciaste el juego!');
        }
        if (!target) {
            return this.sendReply('Por favor especifíca una letra para adivinar.');
        }
        if (target.length > 1) {
            return this.sendReply('Por favor especifíca una letra para adivinar.  Para adivinar la palabra, usa /guessword.');
        }
        lettertarget = target.toLowerCase();
        for (var y = 0; y < 27; y++) {
            if (lettertarget === hangman[room.id].guessedletters[y]) {
                return this.sendReply('Alguien ya adivinó la letra \'' + lettertarget + '\'.');
            }
        }
        var letterright = new Array();
        for (var a = 0; a < hangman[room.id].guessword[0].length; a++) {
            if (lettertarget === hangman[room.id].guessletters[a]) {
                var c = a + 1;
                letterright.push(c);
                hangman[room.id].correctletters.push(c);
                hangman[room.id].spaces[a] = lettertarget;
            }
        }
        if (letterright[0] === undefined) {
            hangman[room.id].givenguesses = hangman[room.id].givenguesses - 1;
            if (hangman[room.id].givenguesses === 0) {
                hangman.reset(room.id);
                return this.add('|html|<b>' + user.name + '</b> intentó la letra \'' + lettertarget + '\', pero no esta en la palabra. Han fallado en adivinar la palabra por lo que el hombre fue ahorcado.');
            }
            this.add('|html|<b>' + user.name + '</b> intentó la letra \'' + lettertarget + '\', intentó la letra.');
        } else {
            this.add('|html|<b>' + user.name + '</b> intentó la letra \'' + lettertarget + '\', que era la letra(s) ' + letterright.toString() + ' of the word.');
        }
        hangman[room.id].guessedletters.push(lettertarget);
        if (hangman[room.id].correctletters.length === hangman[room.id].guessword[0].length) {
            this.add('|html|Congratulations! <b>' + user.name + '</b> has guessed the word, which was: \'' + hangman[room.id].guessword[0] + '\'.');
            hangman.reset(room.id)
        }
    },

    gw: 'guessword',
    guessword: function(target, room, user) {
        if (!this.canTalk()) return;
        if (hangman[room.id].hangman === false) {
            return this.sendReply('No hay juego de hangman en curso.');
        }
        if (target.length > hangman[room.id].guessword[0].length) {
            var hangWordLength = hangman[room.id].guessword[0].length;
            return this.sendReply('Tu intento no puede ser mas largo que la palabra, nub. La palabra contiene ' + hangWordLength + ' letra(s).');
        }
        if (!target) {
            return this.sendReply('Por favor especifíca la palabra que intentas adivinar.');
        }
        if (target.length > 25) {
            return this.sendReply('Este intento es demasiado largo, no puede exceder los 25 caracteres.');
        }
        if (user.userid === hangman[room.id].hangmaner[0]) {
            return this.sendReply('No puedes adivinar debido a que tu iniciaste el juego!');
        }
        var targetword = target.toLowerCase();
        if (targetword === hangman[room.id].guessword[0]) {
            this.add('|html|Congratulations! <b>' + user.name + '</b> ha adivinado la palabra, que era: \'' + hangman[room.id].guessword[0] + '\'.');
            hangman.reset(room.id)
        } else {
            if (hangman[room.id].guessedwords.indexOf(target) != -1) {
                return this.sendReply('Alguien ya intentó adivinar esta palabra.')
            }
            hangman[room.id].givenguesses = hangman[room.id].givenguesses - 1;
            hangman[room.id].guessedwords.push(target);
            if (hangman[room.id].givenguesses === 0) {
                hangman.reset(room.id)
                return this.add('|html|<b>' + user.name + '</b> intento la palabra \'' + targetword + '\', pero esta no era. Fallaron al adivinar la palabra por lo que el hombre fue ahorcado.');
            }
            this.add('|html|<b>' + user.name + '</b> intentó la palabra \'' + targetword + '\', pero esta no era la correcta.');
        }
    },

    eh: 'endhangman',
    endhangman: function(target, room, user) {
        if (!user.can('broadcast', null, room)) {
            return this.sendReply('No tienes suficiente autoridad para hacer esto.');
        }
        if (hangman[room.id].hangman === false) {
            return this.sendReply('No hay un juego de hangman en curso.');
        }
        if (hangman[room.id].hangman === true) {
            this.add('|html|<b>' + user.name + '</b> ha finalizado el juego de hangman.');
            hangman.reset(room.id);
        }
    }
};

for (var i in cmds) CommandParser.commands[i] = cmds[i];
