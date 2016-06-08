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
          //#JSCOVERAGE_IF 0
        }, d || 500);
        //#JSCOVERAGE_ENDIF
      });
    }

    function r(v) {
      return Promise.reject(v);
    }

    function capitalize(s) {
      return s.charAt(0).toLocaleUpperCase() + s.slice(1).toLocaleLowerCase();
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

    function makeMessageParams(text, type) {
      var date = new Date(),
        params = {
          type: type,
          text: encodeHtmlEntities(text)
        };

      if (date.getTime() - self.lastMessageTime > 10 * 60 * 1000) {
        params.day = formatDay(date);
        params.time = formatTime(date);
      }
      params.avatar = params.type === 'sent' ? self.avaSent : self.avaRecv;
      self.lastMessageTime = date.getTime();
      return params;
    }

    function checkMessage(message) {
      var command = {};

      self.busy = true;
      message = message.trim();
      if (message.length > 0) {
        if (message.indexOf('.') === 0) { // silent command
          command.silent = true;
          message = message.substr(1);
        }
        command.message = message;
        return q(command);
      }
      return r();
    }

    function addQuestionMessage(command) {
      if (!command.silent) {
        self.messages.addMessage(makeMessageParams(command.message, 'sent'));
      }
      window.console.debug('Send command: ' + (command.silent ? '(silent) ' : '') + command.message);
      return command;
    }

    function parseProperty(command, propName, toJson) {
      var result;

      if (typeof command[propName] === 'undefined') {
        return void 0;
      }
      if (typeof command[propName] === 'function') {
        result = command[propName](command);
        if (typeof result !== 'object' && toJson) {
          return JSON.parse(result);
        }
        return result;
      }
      if (typeof command[propName] === 'object') {
        command[propName] = JSON.stringify(command[propName]);
      } else if (typeof command[propName] !== 'string') {
        command[propName] = command[propName].toString();
      }
      if (command[propName].indexOf('$') >= 0) { // regex replace
        result = command.message.replace(command.regex, command[propName]);
      } else {
        result = command[propName];
      }
      return toJson ? JSON.parse(result) : result;
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
          command.params = parseProperty(command, 'params', true);
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
          //#JSCOVERAGE_IF 0
          id: c.id || ++self.commandId,
          jsonrpc: c.jsonrpc || '2.0',
          method: c.method,
          params: c.params || {}
            //#JSCOVERAGE_ENDIF
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
        result = command.response + '!';
      } else {
        result = 'OK, the answer is:\n\n' + formatJson(command.response);
      }
      if (self.queue.commands.length) {
        if (typeof result === 'object' && typeof result.then === 'function') {
          return result.then(function (m) {
            if (m) {
              self.queue.answers.push(m);
            }
            return '';
          });
        }
        if (result) {
          self.queue.answers.push(result);
        }
        return '';
      }
      return result;
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

    function init() {
      self.jsonRpcUrl = '/jsonrpc';
      //#JSCOVERAGE_IF 0
      if (window.location.protocol.indexOf('http') === -1) {
        self.jsonRpcUrl = 'http://192.168.237.9:8080' + self.jsonRpcUrl;
        window.console.warn(window.location.protocol + '// connection. Using test server: ' + self.jsonRpcUrl);
      }
      //#JSCOVERAGE_ENDIF
      self.avaRecv = 'img/apple-touch-icon-114x114.png';
      self.avaSent = 'img/i-form-name-ios-114x114.png';
      self.busy = false;
      self.commandId = 0;
      self.lastMessageTime = 0;

      self.commands = [{
        name: 'hello',
        regex: /^(hello)\s*[\.!\?]*$/i,
        answer: 'Hello, I\'m a Kodi Talk bot.\n\nYou may send me an URI to play or another command (try to type "help" for the list of commands I understand)'
      }, {
        name: 'help',
        description: 'get the list of commands I understand.',
        regex: /^(help)\s*[\.!\?]*$/i,
        answer: function () {
          var result = 'I understand the following commmands:';

          self.commands.forEach(function (c) {
            if (typeof c.description !== 'undefined') {
              result += '\n\n‣ ' + c.name + ' — ' + c.description;
            }
          });
          return result;
        }
      }, {
        name: 'play <url>',
        description: 'start playing the given URL. For example,\n"play http://www.sample-videos.com/video/mp4/720/big_buck_bunny_720p_50mb.mp4",\n"play https://youtu.be/YE7VzlLtp-4",\nor simply "https://youtu.be/YE7VzlLtp-4".',
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
        name: 'play tv <channel>',
        description: 'start playing the given TV channel. For example, "play tv 1".\nUse "tv" command to get the list of TV channels.',
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
        description: 'resume paused playback.',
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
        description: 'pause playback.',
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
        description: 'stop playback.',
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
        description: 'check what Kodi is doing now.',
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
          return '‣' + (c.response.item.type && c.response.item.type !== 'unknown' ? (c.response.item.type === 'channel' ? ' ' + c.response.item.channeltype.toUpperCase() : '') + ' ' + c.response.item.type + ': ' : ' ') +
            (c.response.item.artist && c.response.item.artist.length ? c.response.item.artist.join(', ') + ' — ' : '') + c.response.item.label +
            (c.response.item.type === 'channel' ? ' (#' + c.response.item.id + ')' : '');
        }
      }, {
        name: 'tv',
        description: 'get the list of TV channels. You may add a string to filter the channels by name, for example, "tv discovery". For sorting the list by number, use "tv#" command.',
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
              result += ch.channelid + ': ' + ch.label + '\n';
            }
          });
          return result;
        }
      }, {
        name: 'fullscreen',
        description: 'set the fullscrin player mode.',
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
        description: 'show the home screen.',
        regex: /^(home)\s*[\.!\?]*$/i,
        method: 'GUI.ActivateWindow',
        params: {
          window: 'home'
        }
      }, {
        name: 'weather',
        description: 'show the weather screen.',
        regex: /^(weather)\s*[\.!\?]*$/i,
        method: 'GUI.ActivateWindow',
        params: {
          window: 'weather'
        }
      }, {
        // !!! requires script.sleep addon by robwebset http://kodi.wiki/view/Add-on:Sleep
        name: 'sleep <N>',
        description: 'put Kodi to sleep after <N> minutes. Requires "Sleep" addon by robwebset.\nFor example, "sleep 30". Send "sleep 0" to disable sleep timer',
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
        description: 'get the Kodi version.',
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
        description: 'check the availability of the Kodi web server.',
        regex: /^(ping)\s*[\.!\?]*$/i,
        method: 'JSONRPC.Ping'
      }, {
        name: 'say <message>',
        description: 'display the message on the Kodi screen.',
        regex: /^(say)\s+([\S\s]+?)\s*$/i,
        method: 'GUI.ShowNotification',
        params: '{"title":"Kodi Talk","message":"$2"}'
      }, {
        name: 'reboot',
        description: 'reboot the system running Kodi.',
        regex: /^(reboot)\s*[\.!\?]*$/i,
        method: 'System.Reboot'
      }, {
        name: 'shutdown',
        description: 'shutdown the system running Kodi.',
        regex: /^(shutdown)\s*[\.!\?]*$/i,
        method: 'System.Shutdown'
      }, {
        name: 'exec',
        description: 'for geeks only: execute the JSON-RPC <method> with <params>. For example,\n"exec GUI.ActivateWindow {"window":"home"}".',
        regex: /^exec\s+([\w\.]+)\s+(\S+)$/i,
        method: '$1',
        params: '$2'
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
          return self.queue.answers.join(d);
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

          return '# ' + val + ' =\n' + JSON.stringify(eval(val), null, 2);
        }
      }];

      self.queue = {
        commands: [],
        answers: []
      };

    }

    function run() {
      addGreetings();

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

    //#JSCOVERAGE_IF 0
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
    //#JSCOVERAGE_ENDIF
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
