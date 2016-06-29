/* global Framework7: false, Dom7: false, Template7:false, Promise:false */
(function _main(window) {
  'use strict';

  function KTalk() {
    var self = this;

    function q(v) {
      return Promise.resolve(v);
    }

    function qt(v, d) {
      return new Promise(function _executor(resolve) {
        setTimeout(function _ontimeout() {
          resolve(v);
        }, d || 500);
      });
    }

    function r(v) {
      return Promise.reject(v);
    }

    function capitalize(s) {
      return s.charAt(0).toLocaleUpperCase() + s.slice(1); // .toLocaleLowerCase();
    }

    function formatDay(d) {
      var date = d ? new Date(d) : new Date();
      var day = date.getDate();
      var month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()];
      var weekDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];

      return weekDay + ', ' + month + ' ' + day;
    }

    function formatTime(d) {
      var date = d ? new Date(d) : new Date();
      var hours = date.getHours();
      var mins = date.getMinutes();

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
      var NON_ALPHANUMERIC_REGEXP = /([^#-~ |!])/g;
      var SURROGATE_PAIR_REGEXP = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;

      return s.replace(/&/g, '&amp;')
        .replace(SURROGATE_PAIR_REGEXP, function replace(ss) {
          var hi = ss.charCodeAt(0);
          var low = ss.charCodeAt(1);

          return '&#' + ((hi - 0xD800) * 0x400 + (low - 0xDC00) + 0x10000) + ';';
        })
        .replace(NON_ALPHANUMERIC_REGEXP, function replace(ss) {
          return '&#' + ss.charCodeAt(0) + ';';
        })
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }

    function transformPlayerUri(uri) {
      var match;
      var newUri;

      uri = uri.trim();
      // youtube links
      match = (/^https?:\/\/(?:www\.)?youtu(?:\.be|be\.com)\/(?:\S+\/)?(?:[^\s\/]*(?:\?|&)vi?=)?([^#?&\/]+)/i).exec(uri);

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
      return self.commands.find(function _find(c) {
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
      return (entire ? '[[' + text + ']]' : text).replace(re, function replace(m, t, c) {
        return '<a href="#" class="new link" data-command="' + (c || t) + '">' + t + '</a>';
      });
    }

    function messageLinkHandler(event) {
      var message = self.messagebar.value().trim();
      var command = event.target.dataset.command.trim();

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
      var elm;

      if (!command.silent) {
        elm = self.messages.addMessage(makeMessageParams(makeLinks(command.message, true), 'sent'));

        addMessageLinkHandlers(elm);
      }
      window.console.debug('Send command: ' + (command.silent ? '(silent) ' : '') + command.message);
      return command;
    }

    function parseProperty(command, propName) {
      var result = command[propName];
      var parseResult = false;

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
      self.commands.some(function _some(c) {
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
      // helpers
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
      return new Promise(function _executor(resolve, reject) {
        window.d7.ajax({
          url: self.jsonRpcUrl,
          method: 'POST',
          data: makeRequestBody(command),
          success: resolve,
          error: function onError(xhr, status) {
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
      return q().then(function _result() {
        return result;
      }).then(function _format(m) {
        if (self.queue.commands.length) {
          if (typeof m !== 'undefined') {
            self.queue.answers.push(m);
          }
          return '';
        }
        if (typeof m === 'object') {
          m = 'OK, the answer is:\n' + formatJson(m);
        } else if (typeof m === 'undefined') {
          m = '';
        } else if (typeof m !== 'string') {
          m = m.toString();
        }
        return makeLinks(m);
      });
    }

    function formatErrorMessage(message) {
      var result;

      if (typeof message === 'undefined') {
        return '';
      } else if (typeof message === 'object') {
        result = 'ERROR';

        result += message.code ? ' ' + message.code + ':' : ':';
        result += message.name ? ' [' + message.name + ']' : '';
        result += ' ' + message.message;
        return result;
      }
      return message.toString().trim();
    }

    function addReceivedMessage(message, format, className) {
      return q(message).then(format).then(function _addmessage(m) {
        var elm;

        if (m.length === 0) {
          return null;
        }
        elm = self.messages.addMessage(makeMessageParams(m, ('received ' + (m.indexOf('#') === 0 ? 'debug' : className || '')).trim()));
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

    function addMessagesFromHistory() {
      if (!self.appData.messages || self.appData.messages.length < 2) {
        self.appData.messages = [];
        return talkToKodi('.hello');
      }
      self.appData.messages.forEach(function _each(m) {
        var elm = self.messages.addMessage(makeMessageParams(m.text, m.type, m.date, 'no history'));

        addMessageLinkHandlers(elm);
      });
      return q('');
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
        description: 'Start a new conversation with me.',
        regex: /^(hello)\s*[\.!\?]*$/i,
        answer: function _answer() {
          self.messages.clean();
          self.lastMessageTime = 0;
          delete self.appData.messages;
          saveSettings();
          self.queue.commands.push('.version.addon plugin.webinterface.ktalk');
          self.queue.commands.push('.version.kodi');
          self.queue.commands.push('.echo');
          self.queue.commands.push('.echo Send me a media URL you want to play or any other command.\nTo list all commands I understand, type "[[help]]".');
          self.queue.commands.push('.echo');
          self.queue.commands.push('.what\'s up');
          return 'Hello, I\'m a Kodi Talk bot.';
        }
      }, {
        name: 'help',
        description: ['List of available commands.',
          'I also understand you if you type "[[Help]]", "[[Help!]]", "[[help?]]"…',
          'Send me "help command" for detailed description of the command, for example, "[[help play]]" or "[[help tv]]".'
        ],
        regex: /^(help)\s*[\.!\?]*$/i,
        answer: function _answer(c) {
          var result = 'I understand the following commmands:\n';

          self.commands.forEach(function _each(cc) {
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
        answer: function _answer(c) {
          var commandName = getMessageToken(c, 2).trim();
          var command = getCommand(commandName);

          if (command && command.description) {
            return '[[' + command.name + ']]: ' + getCommandDescription(command);
          }
          return 'Sorry, I don\'t know anything about "' + commandName + '" command.';
        }
      }, {
        name: 'play.url',
        regex: /^(?:play)?\s*((?:https?|plugin):\/\/.+)$/i,
        answer: function _answer(c) {
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
        answer: function _answer(c) {
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
          'I also understand links to YouTube: "[[play https://youtu.be/YE7VzlLtp-4]]" or "[[https://youtu.be/YE7VzlLtp-4]]", (you should have Kodi YouTube addon to be installed).',
          'Type "[[play tv 1]]" to start playing the TV channel 1. Use "[[tv]]" command to list of available channels.',
          'Send me "[[play]]" command if you have paused playback and it will be resumed.'
        ],
        regex: /^(play)\s*[\.!\?]*$/i,
        method: 'Player.GetActivePlayers',
        answer: function _answer(c) {
          var result = [];

          c.response.forEach(function _each(o) {
            self.queue.commands.push(['.player.playpause', o.playerid, 1].join(' '));
            result.push(capitalize(o.type) + ' playback [#].');
          });
          if (result.length) {
            self.queue.commands.push('.answers.format ' + JSON.stringify('\n'));
          }
          return result.length ? result : 'There is no active players.';
        }
      }, {
        name: 'pause',
        description: 'Pause playback.',
        regex: /^(pause)\s*[\.!\?]*$/i,
        method: 'Player.GetActivePlayers',
        answer: function _answer(c) {
          var result = [];

          c.response.forEach(function _each(o) {
            self.queue.commands.push(['.player.playpause', o.playerid, 0].join(' '));
            result.push(capitalize(o.type) + ' playback [#].');
          });
          if (result.length) {
            self.queue.commands.push('.answers.format ' + JSON.stringify('\n'));
          }
          return result.length ? result : 'There is no active players.';
        }
      }, {
        name: 'stop',
        description: 'Stop playback.',
        regex: /^(stop)\s*[\.!\?]*$/i,
        method: 'Player.GetActivePlayers',
        answer: function _answer(c) {
          c.response.forEach(function _each(o) {
            self.queue.commands.unshift('.exec Player.Stop {"playerid":' + o.playerid + '}');
          });
          return c.response.length ? 'Stopping ' + c.response.length + ' player' + (c.response.length > 1 ? 's' : '') : 'There is no active players.';
        }
      }, {
        name: 'player.playpause',
        regex: /^(player\.playpause)\s+(\d+)\s+(\d+)$/i,
        method: 'Player.PlayPause',
        params: function _params(c) {
          return {
            playerid: parseInt(getMessageToken(c, 2), 10),
            play: Boolean(parseInt(getMessageToken(c, 3), 10))
          };
        },
        answer: function _answer(c) {
          return c.response.speed === 0 ? 'paused' : 'resumed';
        }
      }, {
        name: 'what\'s up',
        description: 'Check what Kodi is doing now.',
        regex: /^(w(?:hat'?s\s*|ass|azz)up)\s*[\.!\?]*$/i,
        method: 'Player.GetActivePlayers',
        answer: function _answer(c) {
          c.response.forEach(function _each(o) {
            self.queue.commands.push('.player.getitem ' + o.playerid);
          });
          if (c.response.length || self.queue.answers.length) {
            self.queue.commands.push('.answers.join ' + JSON.stringify('\n'));
          }
          return c.response.length ? 'Now playing:' : 'Nothing is playing now.';
        }
      }, {
        name: 'player.getitem',
        regex: /^(player\.getitem)\s+(\d+)$/i,
        method: 'Player.GetItem',
        params: '{"playerid":$2,"properties":["artist","channeltype"]}',
        answer: function _answer(c) {
          var i = c.response.item;

          if (!i.type || i.type === 'unknown') {
            switch (c.params.playerid) {
              case 0:
                i.type = 'audio';
                break;
              case 2:
                i.type = 'picture';
                break;
              default:
                i.type = 'video';
            }
          }
          return '‣ ' + capitalize((i.type === 'channel' ? i.channeltype.toUpperCase() + ' ' : '') + i.type + (i.type === 'channel' ? ' [[' + i.id + '||play tv ' + i.id + ']]' : '') + ': ') +
            (i.artist && i.artist.length ? i.artist.join(', ') + ' — ' : '') + i.label;
        }
      }, {
        name: 'tv',
        description: ['List of available TV channels.',
          'You may add a (sub)string to filter the list by name, for example, "[[tv discovery]]".',
          'For sorting the list by channel number, use "[[tv#]]" or "[[tv# discovery]]".'
        ],
        regex: /^(tv#?)(?:$|\s+(.*)$)/i,
        method: 'PVR.GetChannels',
        params: {
          channelgroupid: 'alltv'
        },
        answer: function _answer(c) {
          var filter = getMessageToken(c, 2).toLowerCase();
          var result = '';
          var sortById = getMessageToken(c, 1).indexOf('#') >= 0;

          c.response.channels.sort(function _sort(a, b) {
            if (sortById) {
              return a.channelid - b.channelid;
            }
            return a.label.localeCompare(b.label);
          });
          c.response.channels.forEach(function _each(ch) {
            if (ch.label.toLowerCase().indexOf(filter) >= 0) {
              result += '[[' + ch.channelid + '||play tv ' + ch.channelid + ']]: ' + ch.label + '\n';
            }
          });
          return result.trim();
        }
      }, {
        name: 'fullscreen',
        description: 'Set the fullscreen player mode.',
        regex: /^(fullscreen)\s*[\.!\?]*$/i,
        method: 'GUI.SetFullscreen',
        params: {
          fullscreen: true
        },
        answer: function _answer(c) {
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
          'For example, if you type "[[sleep 30]]", Kodi will sleep in 30 minutes. Send "[[sleep 0]]" to disable sleep timer.'
        ],
        regex: /^(sleep)\s+(\d+)\s*[\.!\?]*$/i,
        method: 'Addons.GetAddons',
        params: {
          type: 'xbmc.addon.executable',
          enabled: true
        },
        answer: function _answer(c) {
          var i;
          var time = Math.round(parseInt(getMessageToken(c, 2), 10) / 10);
          var sleepAddonExists;

          time = time > 6 ? 6 : time;
          sleepAddonExists = c.response.addons.some(function _some(a) {
            return a.addonid === 'script.sleep';
          });
          if (sleepAddonExists) {
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
            self.queue.commands.push('.echo ' + (time ? 'Sleep timer is set for ' + (time < 6 ? time * 10 + ' minutes.' : '1 hour.') : 'Sleep timer is disabled.'));
            return void 0;
          }
          return r('The required "Sleep" addon by robwebset is not installed.');
        }
      }, {
        name: 'version',
        description: 'Show the Kodi and the Kodi Talk addon versions.',
        regex: /^(version)\s*[\.!\?]*$/i,
        answer: function _answer() {
          self.queue.commands.push('.version.addon plugin.webinterface.ktalk');
          self.queue.commands.push('.version.kodi');
          self.queue.commands.push('.answers.join ' + JSON.stringify('\n'));
        }
      }, {
        name: 'version.kodi',
        regex: /^(version\.kodi)$/i,
        method: 'Application.GetProperties',
        params: {
          properties: ['name', 'version']
        },
        answer: function _answer(c) {
          switch (c.response.version.tag) {
            case 'stable':
              c.response.version.tagversion = '';
              break;
            case 'releasecandidate':
              c.response.version.tagversion = [' RC', c.response.version.tagversion].join(' ').trimRight();
              break;
            default:
              c.response.version.tagversion = ['', capitalize(c.response.version.tag), c.response.version.tagversion].join(' ').trimRight();
          }
          return c.response.name + ' version is ' + c.response.version.major + '.' + c.response.version.minor + c.response.version.tagversion + ' (rev. ' + c.response.version.revision + ').';
        }
      }, {
        name: 'version.addon',
        regex: /^(version\.addon)\s+(.+)$/i,
        method: 'Addons.GetAddonDetails',
        params: '{"addonid":"$2","properties":["name","version"]}',
        answer: function _answer(c) {
          return (c.response.addon.addonid === 'plugin.webinterface.ktalk' ? 'My' : c.response.addon.name + ' addon') + ' version is ' + c.response.addon.version + '.';
        }
      }, {
        name: 'ping',
        description: 'Check the availability of the Kodi.',
        regex: /^(ping)\s*[\.!\?]*$/i,
        method: 'JSONRPC.Ping'
      }, {
        name: 'say',
        description: ['Display the message on the Kodi screen.',
          'For example, "[[say Hello there!]]".'
        ],
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
        name: 'exec',
        description: ['★ For geeks only: execute the JSON-RPC method.',
          'For example, "[[exec GUI.ActivateWindow {"window":"home"}]]".',
          'See the Kodi Wiki for JSON-RPC API description.'
        ],
        regex: /^exec\s+([\w\.]+)\s+(\S+)$/i,
        method: '$1',
        params: '$2'
      }, {
        name: 'echo',
        regex: /^(echo)\s*([\S\s]*)$/i,
        answer: '$2'
      }, {
        name: 'delay',
        regex: /^(delay)\s+(\d+)$/i,
        answer: function _answer(c) {
          var ms = parseInt(getMessageToken(c, 2), 10);

          ms = ms <= 10000 ? ms : 10000;
          return qt('Waiting ' + ms + ' ms.', ms);
        }
      }, {
        name: 'answers.clear',
        regex: /^(answers\.clear)$/i,
        answer: function _answer() {
          self.queue.answers.length = 0;
          return '';
        }
      }, {
        name: 'answers.join',
        regex: /^(answers\.join)\s+(.+)$/i,
        answer: function _answer(c) {
          var d = getMessageToken(c, 2);
          var result;

          d = d.indexOf('"') === 0 ? JSON.parse(d) : d;
          result = self.queue.answers.join(d);
          while (/\u2408/.test(result)) {
            result = result.replace(/[^\u2408]\u2408/g, '');
          }
          self.queue.answers.length = 0;
          return result;
        }
      }, {
        name: 'answers.format',
        regex: /^(answers\.format)\s+(.+)$/i,
        answer: function _answer(c) {
          var a;
          var d = getMessageToken(c, 2);
          var result = self.queue.answers[0];
          var i;

          d = d.indexOf('"') === 0 ? JSON.parse(d) : d;
          if (typeof result.join === 'function') {
            result = result.join(d);
          }
          for (i = 1; i < self.queue.answers.length; ++i) {
            a = self.queue.answers[i];
            result = result.replace('[#]', a);
          }
          while (/\u2408/.test(result)) {
            result = result.replace(/[^\u2408]\u2408/g, '');
          }
          self.queue.answers.length = 0;
          return result;
        }
      }, {
        name: 'debug',
        regex: /^(debug)\s+(.+)$/i,
        answer: function _answer(c) {
          var val = getMessageToken(c, 2);

          // eslint-disable-next-line no-eval
          return '# ' + val + ' =\n' + JSON.stringify(eval(val), null, 2);
        }
      }];

      self.queue = {
        commands: [],
        answers: []
      };
      loadSettings();
    }

    function run() {
      return addMessagesFromHistory().then(function _setfocus() {
        if (!window.f7App.device.os) {
          window.d7('.messagebar textarea').focus();
        }
      });
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
        addMessagesFromHistory: addMessagesFromHistory
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
  window.d7('.messagebar .link').on('click', function _onclick() {
    window.kTalk.sendMessage();
  });

  window.d7('.messagebar textarea').on('keypress', function _onkeypress(e) {
    e = e || window.event;
    if ((e.which || e.keyCode) === 13) {
      e.preventDefault();
      window.kTalk.sendMessage();
    }
  });
}(window));
