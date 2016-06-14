/*global Framework7: false, Dom7: false, Template7:false, Promise:false*/
(function (window) {
  'use strict';

  function KTalk() {
    var self = this;

    function q(v) {
      return Promise.resolve(v);
    }

    function qt(v, d) {
      return new Promise(function (resolve) {
        setTimeout(function () {
          resolve(v);
        }, d || 500);
      });
    }

    function r(v) {
      return Promise.reject(v);
    }

    function capitalize(s) {
      return s.charAt(0).toLocaleUpperCase() + s.slice(1); //.toLocaleLowerCase();
    }

    function formatDay(d) {
      var date = d ? new Date(d) : new Date(),
        day = date.getDate(),
        month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()],
        weekDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];

      return weekDay + ', ' + month + ' ' + day;
    }

    function formatTime(d) {
      var date = d ? new Date(d) : new Date(),
        hours = date.getHours(),
        mins = date.getMinutes();

      return (hours < 10 ? '0' : '') + hours + (mins < 10 ? ':0' : ':') + mins;
    }

    function formatDate(d) {
      return formatDay(d) + ', <span>' + formatTime(d) + '</span>';
    }

    function formatJson(o) {
      return (JSON.stringify(o, null, 4) + '\n')
        .replace(/^ *[\{\}] *(?:\r\n|\r|\n)+/gm, '')
        .replace(/ *[\{\}] *|"/g, '')
        .replace(/ *, *$/gm, '')
        .replace(/\[/g, '(')
        .replace(/\]/g, ')')
        .trimRight();
    }

    function encodeHtmlEntities(s) {
      var NON_ALPHANUMERIC_REGEXP = /([^#-~ |!])/g,
        SURROGATE_PAIR_REGEXP = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;

      return s.replace(/&/g, '&amp;')
        .replace(SURROGATE_PAIR_REGEXP, function (ss) {
          var hi = ss.charCodeAt(0),
            low = ss.charCodeAt(1);

          return '&#' + ((hi - 0xD800) * 0x400 + (low - 0xDC00) + 0x10000) + ';';
        })
        .replace(NON_ALPHANUMERIC_REGEXP, function (ss) {
          return '&#' + ss.charCodeAt(0) + ';';
        })
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }

    function transformPlayerUri(uri) {
      uri = uri.trim();
      // youtube links
      var match = (/^https?:\/\/(?:www\.)?youtu(?:\.be|be\.com)\/(?:\S+\/)?(?:[^\s\/]*(?:\?|&)vi?=)?([^#?&\/]+)/i).exec(uri),
        newUri;

      if (match) {
        newUri = 'plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=' + match[1];
        window.console.info('URI ' + uri + ' transformed to ' + newUri);
        return newUri;
      }
      return uri;
    }

    function getMessageToken(command, token) {
      return command.message.replace(command.regex, '$' + token);
    }

    function getCommand(name) {
      return self.commands.find(function (c) {
        return c.name === name;
      });
    }

    function getCommandDescription(command, short) {
      var result = command.description || '';
      if (window.d7.isArray(result)) {
        if (short) {
          result = result[0];
          if (command.description.length > 1) {
            return result + ' [[(…)||help ' + command.name + ']]';
          }
        }
        return result.join('\n');
      }
      return result;
    }

    function makeLinks(text, entire) {
      var re = /\[\[(.*?)(?:\|\|(.*?))?\]\]/g;

      text = encodeHtmlEntities(text);
      return (entire ? '[[' + text + ']]' : text).replace(re, function (m, t, c) {
        return '<a href="#" class="new link" data-command="' + (c || t) + '">' + t + '</a>';
      });
    }

    function messageLinkHandler(event) {
      var message = self.messagebar.value().trim(),
        command = event.target.dataset.command.trim();

      message = (getCommand('help').regex.test(message) ? message + ' ' : '') + command;
      self.messagebar.value(message);
    }

    function addMessageLinkHandlers(element) {
      window.d7(element).find('.link').on('click', messageLinkHandler);
    }

    function loadSettings() {
      self.appData = JSON.parse(self.dataStorage.getItem(self.dataKey) || '{}');
    }

    function saveSettings() {
      self.dataStorage.setItem(self.dataKey, JSON.stringify(self.appData || {}));
    }

    function addMessageToHistory(text, type, date) {

      self.appData.messages = self.appData.messages || [];
      while (self.appData.messages.length >= self.messageHistorySize) {
        self.appData.messages.shift();
      }
      self.appData.messages.push({
        date: date,
        text: text,
        type: type
      });
      saveSettings();
    }

    function makeMessageParams(text, type, date, noHistory) {
      var params = {
        type: type,
        text: text
      };

      date = date ? new Date(date) : new Date();
      if (date.getTime() - self.lastMessageTime > 10 * 60 * 1000) {
        params.day = formatDay(date);
        params.time = formatTime(date);
      }
      params.avatar = params.type === 'sent' ? self.avaSent : self.avaRecv;
      self.lastMessageTime = date.getTime();
      if (!noHistory) {
        addMessageToHistory(text, type, date);
      }
      return params;
    }

    function checkMessage(message) {
      var command = {};

      self.busy = true;
      message = message.trim();
      while (message.indexOf('.') === 0) { // silent command
        command.silent = true;
        message = message.substr(1);
      }
      if (message.length > 0) {
        command.message = message;
        return q(command);
      }
      return r();
    }

    function addQuestionMessage(command) {
      if (!command.silent) {
        var elm = self.messages.addMessage(makeMessageParams(makeLinks(command.message, true), 'sent'));
        addMessageLinkHandlers(elm);
      }
      window.console.debug('Send command: ' + (command.silent ? '(silent) ' : '') + command.message);
      return command;
    }

    function parseProperty(command, propName) {
      var result = command[propName],
        parseResult = false;

      if (typeof result === 'function') {
        result = result(command);
      }
      if (typeof result === 'undefined') {
        return void 0;
      }
      if (typeof result === 'string' || typeof result === 'object') {
        if (typeof result.then === 'function') {
          return result;
        }
        if (typeof result === 'object') {
          result = JSON.stringify(result);
          parseResult = true;
        }
        if (result.indexOf('$') >= 0) {
          result = command.message.replace(command.regex, result);
        }
        return parseResult ? JSON.parse(result) : result.trim();
      }
      return result;
    }

    function parseKodiCommand(command) {
      self.commands.some(function (c) {
        if (c.regex.test(command.message)) {
          command.name = c.name;
          command.description = c.description;
          command.regex = c.regex;
          command.method = c.method;
          command.params = c.params;
          command.answer = c.answer;
          command.method = parseProperty(command, 'method');
          command.params = parseProperty(command, 'params');
          if (typeof command.params === 'string') {
            command.params = JSON.parse(command.params);
          }
          return true;
        }
        return false;
      });
      if (typeof command.regex !== 'undefined') {
        return command;
      }
      return r('Sorry, I can\'t understand you. I will learn more commands soon.');
    }

    function callJsonRpcMethod(command) {

      function makeRequestBody(c) {
        var result = JSON.stringify({
          id: c.id || ++self.commandId,
          jsonrpc: c.jsonrpc || '2.0',
          method: c.method,
          params: c.params || {}
        });

        // window.console.debug(result);
        return result;
      }

      function parseResult(o) {
        if (!o.error) {
          command.response = o.result;
          return command;
        }
        return Promise.reject(o.error);
      }

      if (typeof command.method === 'undefined') {
        return command;
      }
      return new Promise(function (resolve, reject) {
        window.d7.ajax({
          url: self.jsonRpcUrl,
          method: 'POST',
          data: makeRequestBody(command),
          success: resolve,
          error: function (xhr, status) {
            reject({
              code: status.toString(),
              message: 'Failed to complete JSON-RPC request to the Kodi server.'
            });
          }
        });
      }).then(JSON.parse).then(parseResult);
    }

    function formatAnswerMessage(command) {
      var result;

      if (typeof command.answer !== 'undefined') {
        result = parseProperty(command, 'answer');
      } else if (typeof command.response === 'string') {
        result = capitalize(command.response) + '!';
      } else {
        result = command.response;
      }
      return q().then(function () {
        return result;
      }).then(function (m) {
        if (self.queue.commands.length) {
          if (m) {
            self.queue.answers.push(m);
          }
          return '';
        }
        if (typeof m === 'object') {
          m = 'OK, the answer is:\n' + formatJson(m);
        } else if (typeof m !== 'string') {
          m = m.toString();
        }
        return makeLinks(m);
      });
    }

    function formatErrorMessage(message) {
      if (typeof message === 'undefined') {
        return '';
      } else if (typeof message === 'object') {
        var result = 'ERROR';

        result += message.code ? ' ' + message.code + ':' : ':';
        result += message.name ? ' [' + message.name + ']' : '';
        result += ' ' + message.message;
        return result;
      }
      return message.toString().trim();
    }

    function addReceivedMessage(message, format, className) {
      return q(message).then(format).then(function (m) {
        if (m.length === 0) {
          return null;
        }
        var elm = self.messages.addMessage(makeMessageParams(m, 'received'));

        if (m.indexOf('#') === 0) {
          elm.classList.add('debug');
        } else if (className) {
          elm.classList.add(className);
        }
        addMessageLinkHandlers(elm);
        return elm;
      });
    }

    function addAnswerMessage(command) {
      return addReceivedMessage(command, formatAnswerMessage);
    }

    function addErrorMessage(message) {
      return addReceivedMessage(message, formatErrorMessage, 'error');
    }

    function sendCommand(message) {
      return checkMessage(message)
        .then(addQuestionMessage)
        .then(parseKodiCommand)
        .then(callJsonRpcMethod)
        .then(addAnswerMessage)
        .then(q, addErrorMessage); // JSLint friendly instead of .catch()
    }

    function sendQueuedCommand() {
      var command = self.queue.commands.shift();

      if (command) {
        return sendCommand(command).then(sendQueuedCommand);
      }
      self.queue.answers.length = 0;
      self.busy = false;
      return 'Finished.';
    }

    function talkToKodi(message) {
      return sendCommand(message).then(sendQueuedCommand);
    }

    function addGreetings() {
      return ['.hello', '.version', '.what\'s up?'].reduce(function (p, c) {
        return p.then(function () {
          return talkToKodi(c);
        });
      }, q());
    }

    function addMessagesFromHistory() {
      if (!self.appData.messages || self.appData.messages.length < 1) {
        return;
      }
      self.appData.messages.forEach(function (m) {
        var elm = self.messages.addMessage(makeMessageParams(m.text, m.type, m.date, 'no history'));
        addMessageLinkHandlers(elm);
      });
    }

    function init() {
      self.jsonRpcUrl = '/jsonrpc';
      if (window.location.protocol.indexOf('http') === -1) {
        self.jsonRpcUrl = 'http://192.168.237.9:8080' + self.jsonRpcUrl;
        window.console.warn(window.location.protocol + '// connection. Using test server: ' + self.jsonRpcUrl);
      }
      self.dataStorage = window.localStorage;
      self.dataKey = 'kodi.webinterface.ktalk';
      self.avaRecv = 'img/apple-touch-icon-114x114.png';
      self.avaSent = 'img/i-form-name-ios-114x114.png';
      self.busy = false;
      self.commandId = 0;
      self.lastMessageTime = 0;
      self.messageHistorySize = 100;

      self.commands = [{
        name: 'hello',
        regex: /^(hello)\s*[\.!\?]*$/i,
        answer: 'Hello, I\'m a Kodi Talk bot.\n\nSend me a media URL you want to play or any other command.\nTo list all commands I understand, type "[[help]]".'
      }, {
        name: 'help',
        description: ['List of available commands.',
          'I also understand you if you type "[[Help]]", "[[Help!]]", "[[help?]]"…',
          'Send me "help command" for detailed description of the command, for example, "[[help play]]" or "[[help tv]]".'],
        regex: /^(help)\s*[\.!\?]*$/i,
        answer: function (c) {
          var result = 'I understand the following commmands:\n';

          self.commands.forEach(function (cc) {
            if (typeof cc.description !== 'undefined') {
              result += '‣ [[' + cc.name + ']]: ' + getCommandDescription(cc, 'short') + '\n';
            }
          });
          result += '\n' + c.description[2];
          return result;
        }
      }, {
        name: 'help.detail',
        regex: /^(help)\s+(\S[\S\s]*)$/i,
        answer: function (c) {
          var commandName = getMessageToken(c, 2).trim(),
            command = getCommand(commandName);
          if (command && command.description) {
            return '[[' + command.name + ']]: ' + getCommandDescription(command);
          }
          return 'Sorry, I don\'t know anything about "' + commandName + '" command';
        }
      }, {
        name: 'play.url',
        regex: /^(?:play)?\s*((?:https?|plugin):\/\/.+)$/i,
        answer: function (c) {
          var file = transformPlayerUri(getMessageToken(c, 1));

          self.queue.commands.push('.stop');
          self.queue.commands.push('.exec Player.Open {"item":{"file":"' + file + '"}}');
          self.queue.commands.push('.delay 1000');
          self.queue.commands.push('.answers.clear');
          self.queue.commands.push('.what\'s up');
          return 'Start playing URL: ' + file;
        }
      }, {
        name: 'play.tv',
        regex: /^play\s+tv\s+(\d+)\s*[\.!\?]*$/i,
        answer: function (c) {
          var id = getMessageToken(c, 1);

          self.queue.commands.push('.stop');
          self.queue.commands.push('.exec Player.Open {"item":{"channelid":' + id + '}}');
          self.queue.commands.push('.delay 1000');
          self.queue.commands.push('.answers.clear');
          self.queue.commands.push('.what\'s up');
          return 'Start playing TV channel #' + id;
        }
      }, {
        name: 'play',
        description: ['Start playing the given media URL, or TV channel, or resume paused playback.',
          'Send me "[[play http://www.sample-videos.com/video/mp4/720/big_buck_bunny_720p_50mb.mp4]]" or simply "[[http://www.sample-videos.com/video/mp4/720/big_buck_bunny_720p_50mb.mp4]]" to start playing video file.',
          'I also understand links to YouTube: "[[play https://youtu.be/YE7VzlLtp-4]]" or "[[https://youtu.be/YE7VzlLtp-4]]", (you should have Kodi Youtube addon to be installed).',
          'Type "[[play tv 1]]" to start playing the TV channel 1. Use "[[tv]]" command to list of available channels.',
          'Send me "[[play]]" command if you have paused playback and it will be resumed.'],
        regex: /^(play)\s*[\.!\?]*$/i,
        method: 'Player.GetActivePlayers',
        answer: function (c) {
          var result = [];

          c.response.forEach(function (o) {
            self.queue.commands.push(['.player.playpause', o.playerid, 1].join(' '));
            result.push(capitalize(o.type) + ' playback [#].');
          });
          self.queue.commands.push('.answers.format ' + JSON.stringify('\n'));
          return c.response.length === 0 ? 'There is no active players.' : result;
        }
      }, {
        name: 'pause',
        description: 'Pause playback.',
        regex: /^(pause)\s*[\.!\?]*$/i,
        method: 'Player.GetActivePlayers',
        answer: function (c) {
          var result = [];

          c.response.forEach(function (o) {
            self.queue.commands.push(['.player.playpause', o.playerid, 0].join(' '));
            result.push(capitalize(o.type) + ' playback [#].');
          });
          self.queue.commands.push('.answers.format ' + JSON.stringify('\n'));
          return c.response.length === 0 ? 'There is no active players.' : result;
        }
      }, {
        name: 'stop',
        description: 'Stop playback.',
        regex: /^(stop)\s*[\.!\?]*$/i,
        method: 'Player.GetActivePlayers',
        answer: function (c) {
          c.response.forEach(function (o) {
            self.queue.commands.unshift('.exec Player.Stop {"playerid":' + o.playerid + '}');
          });
          return c.response.length === 0 ? 'There is no active players.' : 'Stopping ' + c.response.length + ' player(s)';
        }
      }, {
        name: 'player.playpause',
        regex: /^(player\.playpause)\s+(\d+)\s+(\d+)$/i,
        method: 'Player.PlayPause',
        params: function (c) {
          return {
            playerid: parseInt(getMessageToken(c, 2), 10),
            play: Boolean(parseInt(getMessageToken(c, 3), 10))
          };
        },
        answer: function (c) {
          return c.response.speed === 0 ? 'paused' : 'resumed';
        }
      }, {
        name: 'what\'s up',
        description: 'Check what Kodi is doing now.',
        regex: /^(w(?:hat'?s\s*|ass|azz)up)\s*[\.!\?]*$/i,
        method: 'Player.GetActivePlayers',
        answer: function (c) {
          c.response.forEach(function (o) {
            self.queue.commands.push('.player.getitem ' + o.playerid);
          });
          self.queue.commands.push('.answers.join ' + JSON.stringify('\n'));
          return c.response.length === 0 ? 'Nothing is playing now.' : 'Now playing:';
        }
      }, {
        name: 'player.getitem',
        regex: /^(player\.getitem)\s+(\d+)$/i,
        method: 'Player.GetItem',
        params: '{"playerid":$2,"properties":["artist","channeltype"]}',
        answer: function (c) {
          var i = c.response.item;

          return '‣' + (i.type && i.type !== 'unknown' ? (i.type === 'channel' ? ' ' + i.channeltype.toUpperCase() : '') + ' ' + i.type + (i.type === 'channel' ? ' [[' + i.id + '||play tv ' + i.id + ']]' : '') + ': ' : ' ') +
            (i.artist && i.artist.length ? i.artist.join(', ') + ' — ' : '') + i.label;
        }
      }, {
        name: 'tv',
        description: ['List of available TV channels.',
          'You may add a (sub)string to filter the list by name, for example, "[[tv discovery]]".',
          'For sorting the list by channel number, use "[[tv#]]" or "[[tv# discovery]]".'],
        regex: /^(tv#?)(?:$|\s+(.*)$)/i,
        method: 'PVR.GetChannels',
        params: {
          channelgroupid: 'alltv'
        },
        answer: function (c) {
          var filter = getMessageToken(c, 2).toLowerCase(),
            result = '',
            sortById = getMessageToken(c, 1).indexOf('#') >= 0;

          c.response.channels.sort(function (a, b) {
            if (sortById) {
              return a.channelid - b.channelid;
            }
            return a.label.localeCompare(b.label);
          });
          c.response.channels.forEach(function (ch) {
            if (ch.label.toLowerCase().indexOf(filter) >= 0) {
              result += '[[' + ch.channelid + '||play tv ' + ch.channelid + ']]: ' + ch.label + '\n';
            }
          });
          return result;
        }
      }, {
        name: 'fullscreen',
        description: 'Set the fullscreen player mode.',
        regex: /^(fullscreen)\s*[\.!\?]*$/i,
        method: 'GUI.SetFullscreen',
        params: {
          fullscreen: true
        },
        answer: function (c) {
          return c.response ? 'OK, fullscreen mode activated.' : 'Oops, still in GUI mode.';
        }
      }, {
        name: 'home',
        description: 'Show the home screen.',
        regex: /^(home)\s*[\.!\?]*$/i,
        method: 'GUI.ActivateWindow',
        params: {
          window: 'home'
        }
      }, {
        name: 'weather',
        description: 'Show the weather forecast.',
        regex: /^(weather)\s*[\.!\?]*$/i,
        method: 'GUI.ActivateWindow',
        params: {
          window: 'weather'
        }
      }, {
        // !!! requires script.sleep addon by robwebset http://kodi.wiki/view/Add-on:Sleep
        name: 'sleep',
        description: ['Put Kodi to sleep after specified time in minutes.',
          '★ Requires "Sleep" addon by robwebset.',
          'For example, if you type "[[sleep 30]]", Kodi will sleep in 30 minutes. Send "[[sleep 0]]" to disable sleep timer.'],
        regex: /^(sleep)\s+(\d+)\s*[\.!\?]*$/i,
        method: 'Addons.GetAddons',
        params: {
          type: 'xbmc.addon.executable',
          enabled: true
        },
        answer: function (c) {
          var i,
            time = Math.round(parseInt(getMessageToken(c, 2), 10) / 10);

          time = time < 0 ? 0 : time > 6 ? 6 : time;
          if (c.response.addons.some(function (a) {
              return a.addonid === 'script.sleep';
            })) {
            self.queue.commands.push('.exec Addons.ExecuteAddon {"addonid":"script.sleep"}');
            self.queue.commands.push('.delay 1500');

            self.queue.commands.push('.exec Input.Left {}');
            for (i = 0; i < 7; ++i) {
              self.queue.commands.push('.exec Input.Select {}');
            }
            if (time) {
              self.queue.commands.push('.exec Input.Right {}');
              for (i = 0; i < time; ++i) {
                self.queue.commands.push('.exec Input.Select {}');
              }
            }
            self.queue.commands.push('.delay 1500');
            self.queue.commands.push('.exec Input.Back {}');
            return 'Set sleep timer to ' + time * 10 + ' min.';
          }
          return r('The required "Sleep" addon by robwebset is not installed.');
        }
      }, {
        name: 'version',
        description: 'Show the Kodi and the Kodi Talk addon versions.',
        regex: /^(version)\s*[\.!\?]*$/i,
        method: 'Application.GetProperties',
        params: {
          properties: ['name', 'version']
        },
        answer: function (c) {
          self.queue.commands.push('.version.addon plugin.webinterface.ktalk');
          self.queue.commands.push('.answers.join ' + JSON.stringify('\n'));
          return c.response.name + ' ' + c.response.version.major + '.' + c.response.version.minor + (c.response.version.tag === 'releasecandidate' ? ' RC ' + c.response.version.tagversion : '') + ' (rev. ' + c.response.version.revision + ')';
        }
      }, {
        name: 'version.addon',
        regex: /^(version\.addon)\s+(.+)$/i,
        method: 'Addons.GetAddonDetails',
        params: '{"addonid":"$2","properties":["name","version"]}',
        answer: function (c) {
          return c.response.addon.name + ' addon ' + c.response.addon.version;
        }
      }, {
        name: 'ping',
        description: 'Check the availability of the Kodi.',
        regex: /^(ping)\s*[\.!\?]*$/i,
        method: 'JSONRPC.Ping'
      }, {
        name: 'say',
        description: ['Display the message on the Kodi screen.',
          'For example, "[[say Hello there!]]".'],
        regex: /^(say)\s+([\S\s]+?)\s*$/i,
        method: 'GUI.ShowNotification',
        params: '{"title":"Kodi Talk","message":"$2"}'
      }, {
        name: 'reboot',
        description: 'Reboot the system running Kodi.',
        regex: /^(reboot)\s*[\.!\?]*$/i,
        method: 'System.Reboot'
      }, {
        name: 'shutdown',
        description: 'Shutdown the system running Kodi.',
        regex: /^(shutdown)\s*[\.!\?]*$/i,
        method: 'System.Shutdown'
      }, {
        name: 'new chat',
        description: 'Clean up the existing conversation and start the new chat.',
        regex: /^(new\s+chat)\s*[\.!\?]*$/i,
        answer: function () {
          self.messages.clean();
          delete self.appData.messages;
          saveSettings();
          addGreetings();
          return '';
        }
      }, {
        name: 'exec',
        description: ['★ For geeks only: execute the JSON-RPC method.',
          'For example, "[[exec GUI.ActivateWindow {"window":"home"}]]".',
          'See the Kodi Wiki for JSON-RPC API description.'],
        regex: /^exec\s+([\w\.]+)\s+(\S+)$/i,
        method: '$1',
        params: '$2'
      }, {
        name: 'echo',
        regex: /^(echo)\s+([\S\s]+?)\s*$/i,
        answer: '$2'
      }, {
        name: 'delay',
        regex: /^(delay)\s+(\d+)$/i,
        answer: function (c) {
          var ms = parseInt(getMessageToken(c, 2), 10);

          return qt('Waiting ' + ms + ' ms.', ms);
        }
      }, {
        name: 'answers.clear',
        regex: /^(answers\.clear)$/i,
        answer: function () {
          self.queue.answers.length = 0;
          return '';
        }
      }, {
        name: 'answers.join',
        regex: /^(answers\.join)\s+(.+)$/i,
        answer: function (c) {
          var d = getMessageToken(c, 2);

          d = d.indexOf('"') === 0 ? JSON.parse(d) : d;
          return self.queue.answers.join(d).replace(/[\s\S]\u2408/, '');
        }
      }, {
        name: 'answers.format',
        regex: /^(answers\.format)\s+(.+)$/i,
        answer: function (c) {
          var a,
            d = getMessageToken(c, 2),
            f = self.queue.answers[0],
            i;

          d = d.indexOf('"') === 0 ? JSON.parse(d) : d;
          if (typeof f === 'string') {
            f = [f];
          }
          for (i = 0; i < f.length; ++i) {
            a = self.queue.answers[i + 1] || '';
            f[i] = f[i].replace('[#]', a);
          }
          return f.join(d);
        }
      }, {
        name: 'debug',
        regex: /^(debug)\s+(.+)$/i,
        answer: function (c) {
          var val = getMessageToken(c, 2);

          /*jslint evil: true*/
          return '# ' + val + ' =\n' + JSON.stringify(eval(val), null, 2);
        }
      }];
      /*jslint evil: false*/

      self.queue = {
        commands: [],
        answers: []
      };
      loadSettings();
    }

    function run() {
      if (self.appData.messages && self.appData.messages.length > 0) {
        addMessagesFromHistory();
      } else {
        addGreetings();
      }

      if (!window.f7App.device.os) {
        setTimeout(function () {
          window.d7('.messagebar textarea').focus();
        }, 100);
      }
    }

    function sendMessage(message) {
      message = message || self.messagebar.value();
      if (self.busy) {
        return qt(message, 300).then(sendMessage);
      }
      return (talkToKodi(message)).then(self.messagebar.clear);
    }

    if (window.jasmine) {
      self.testing = { // reveal private methods for testing
        q: q,
        qt: qt,
        r: r,
        capitalize: capitalize,
        formatDay: formatDay,
        formatTime: formatTime,
        formatDate: formatDate,
        formatJson: formatJson,
        encodeHtmlEntities: encodeHtmlEntities,
        transformPlayerUri: transformPlayerUri,
        getMessageToken: getMessageToken,
        getCommand: getCommand,
        getCommandDescription: getCommandDescription,
        makeLinks: makeLinks,
        messageLinkHandler: messageLinkHandler,
        addMessageLinkHandlers: addMessageLinkHandlers,
        loadSettings: loadSettings,
        saveSettings: saveSettings,
        addMessageToHistory: addMessageToHistory,
        makeMessageParams: makeMessageParams,
        checkMessage: checkMessage,
        addQuestionMessage: addQuestionMessage,
        parseProperty: parseProperty,
        parseKodiCommand: parseKodiCommand,
        callJsonRpcMethod: callJsonRpcMethod,
        formatAnswerMessage: formatAnswerMessage,
        formatErrorMessage: formatErrorMessage,
        addReceivedMessage: addReceivedMessage,
        addAnswerMessage: addAnswerMessage,
        addErrorMessage: addErrorMessage,
        sendCommand: sendCommand,
        sendQueuedCommand: sendQueuedCommand,
        talkToKodi: talkToKodi,
        addGreetings: addGreetings
      };
    }
    self.init = init;
    self.run = run;
    self.sendMessage = sendMessage;

    return self;
  }

  window.f7App = new Framework7();
  window.d7 = Dom7;
  window.kTalk = new KTalk();
  window.kTalk.init();

  // Global ajax options
  window.d7.ajaxSetup({
    processData: false,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  window.kTalk.messages = window.f7App.messages('.messages', {
    autoLayout: true
  });

  // fix space between {{day}} and ","
  if (window.kTalk.messages.params.messageTemplate.indexOf('{{day}} {{#if time}},') >= 0) {
    window.kTalk.messages.params.messageTemplate = window.kTalk.messages.params.messageTemplate.replace('{{day}} {{#if time}},', '{{day}}{{#if time}},');
    window.kTalk.messages.template = Template7.compile(window.kTalk.messages.params.messageTemplate);
    window.console.info('Message template fixed');
  }

  window.kTalk.messagebar = window.f7App.messagebar('.messagebar');

  // Fix for missing iPhone status bar in landscape mode
  window.f7App.device.statusBar = false;
  window.d7('html').removeClass('with-statusbar-overlay');

  // Handle message
  window.d7('.messagebar .link').on('click', function () {
    window.kTalk.sendMessage();
  });

  window.d7('.messagebar textarea').on('keypress', function (e) {
    e = e || window.event;
    if ((e.which || e.keyCode) === 13) {
      e.preventDefault();
      window.kTalk.sendMessage();
    }
  });

}(window));
