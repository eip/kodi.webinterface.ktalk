/*global Framework7: false, Dom7: false, Template7:false, Promise:false*/
(function () {
  'use strict';

  function transformPlayerUri(uri) {
    uri = uri.trim();
    // youtube links
    var match = /^https?:\/\/(?:www\.)?youtu(?:\.be|be\.com)\/(?:\S+\/)?(?:[^\s\/]*(?:\?|&)vi?=)?([^#?&]+)/i.exec(uri),
      newUri;
    if (match) {
      newUri = 'plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=' + match[1];
      window.console.info('URI ' + uri + ' transformed to ' + newUri);
      return newUri;
    }
    return uri;
  }

  var ktalkApp = new Framework7(),
    $$ = Dom7,
    ktalkMessages = ktalkApp.messages('.messages', {
      autoLayout: true
    }),
    ktalkMessagebar = ktalkApp.messagebar('.messagebar'),
    ktalkJsonRpcUrl = '/jsonrpc',
    ktalkAvaRecv = 'img/apple-touch-icon-114x114.png',
    ktalkAvaSent = 'img/i-form-name-ios-114x114.png',
    ktalkCommands = [],
    ktalkQueue = {
      commands: [],
      answers: []
    },
    ktalkBusy = false,
    lastMessageTime = 0;

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

  function formatDay(d) {
    var date = d ? new Date(d) : new Date(),
      weekDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()],
      day = date.getDate(),
      month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()];
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
    var SURROGATE_PAIR_REGEXP = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g,
      NON_ALPHANUMERIC_REGEXP = /([^\#-~ |!])/g;

    return s.replace(/&/g, '&amp;')
      .replace(SURROGATE_PAIR_REGEXP, function (s) {
        var hi = s.charCodeAt(0),
          low = s.charCodeAt(1);
        return '&#' + (((hi - 0xD800) * 0x400) + (low - 0xDC00) + 0x10000) + ';';
      })
      .replace(NON_ALPHANUMERIC_REGEXP, function (s) {
        return '&#' + s.charCodeAt(0) + ';';
      })
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function makeMessageProps(text, type) {
    var props = {
        type: type,
        text: encodeHtmlEntities(text)
      },
      date = new Date();
    if (date.getTime() - lastMessageTime > 10 * 60 * 1000) {
      props.day = formatDay(date);
      props.time = formatTime(date);
    }
    props.avatar = props.type === 'sent' ? ktalkAvaSent : ktalkAvaRecv;
    lastMessageTime = date.getTime();
    return props;
  }

  function fixMessageTemplate() {
    // fix space between {{day}} and ","
    if (ktalkMessages.params.messageTemplate.indexOf('{{day}} {{#if time}},') >= 0) {
      ktalkMessages.params.messageTemplate = ktalkMessages.params.messageTemplate.replace('{{day}} {{#if time}},', '{{day}}{{#if time}},');
      ktalkMessages.template = Template7.compile(ktalkMessages.params.messageTemplate);
      window.console.info('Message template fixed');
    }
  }

  function sendCommand(message, silent) {
    var currentCommand; // current command

    function checkMessage(m) {
      ktalkBusy = true;
      m = m.trim();
      if (m.length > 0) {
        return q(m);
      } else {
        return r();
      }
    }

    function addQuestionMessage(m) {
      if (!silent) {
        ktalkMessages.addMessage(makeMessageProps(m, 'sent'));
      }
      window.console.debug('Send command: ' + (silent ? '…' : '') + m);
      return m;
    }

    function parseProperty(message, command, propName, toJson) {
      var result;
      if (typeof command[propName] === 'undefined') {
        return;
      }
      if (typeof command[propName] === 'function') {
        result = command[propName](message, command);
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
        result = message.replace(command.regex, command[propName]);
      } else {
        result = command[propName];
      }
      return toJson ? JSON.parse(result) : result;
    }

    function parseKodiCommand(message) {
      var request;
      ktalkCommands.some(function (c) {
        if (c.regex.test(message)) {
          request = {
            method: parseProperty(message, c, 'method'),
            params: parseProperty(message, c, 'params', true)
          };
          currentCommand = {
            message: message,
            name: c.name,
            description: c.description,
            regex: c.regex,
            method: request.method,
            params: request.params,
            handleResponse: c.handleResponse
          };
          return true;
        }
        return false;
      });
      if (typeof request !== 'undefined') {
        return request;
      }
      return r('Sorry, I can\'t understand you. I will learn more commands soon.');
    }

    function callJsonRpcMethod(params) {

      function makeRequestBody(b) {
        return JSON.stringify({
          id: b.id || 1,
          jsonrpc: b.jsonrpc || '2.0',
          method: b.method,
          params: b.params || {}
        });
      }

      function parseResult(r) {
        if (!r.error) {
          return r.result;
        }
        return Promise.reject(r.error);
      }

      if (typeof params === 'undefined' || typeof params.method === 'undefined') {
        return '';
      }
      return new Promise(function (resolve, reject) {
        $$.ajax({
          url: ktalkJsonRpcUrl,
          method: 'POST',
          data: makeRequestBody(params),
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

    function formatAnswerMessage(m) {
      var result;
      if (typeof currentCommand.handleResponse !== 'undefined') {
        result = parseProperty(m, currentCommand, 'handleResponse');
      } else if (typeof m === 'string') {
        result = m + '!';
      } else {
        result = 'OK, the answer is:\n\n' + formatJson(m);
      }
      if (ktalkQueue.commands.length) {
        if (typeof result === 'object' && typeof result.then === 'function') {
          return result.then(function (m) {
            // window.console.debug('Silent answer: ' + (m || '<empty>') + ' (command: ' + command.message + ')');
            if (m) {
              ktalkQueue.answers.push(m);
            }
            return '';
          });
        }
        // window.console.debug('Silent answer: ' + (result || '<empty>') + ' (command: ' + command.message + ')');
        if (result) {
          ktalkQueue.answers.push(result);
        }
        return '';
      }
      return result;
    }

    function formatErrorMessage(m) {
      if (typeof m === 'undefined') {
        return '';
      } else if (typeof m === 'object') {
        var result = 'ERROR';
        result += m.code ? ' ' + m.code + ':' : ':';
        result += m.name ? ' [' + m.name + ']' : '';
        result += ' ' + m.message;
        return result;
      }
      return m.toString().trim();
    }

    function addReceivedMessage(message, format, className) {
      return q(message).then(format).then(function (message) {
        if (message.length === 0) {
          return null;
        }
        var elm = ktalkMessages.addMessage(makeMessageProps(message, 'received'));
        if (message.indexOf('#') === 0) {
          elm.classList.add('debug');
        } else if (className) {
          elm.classList.add(className);
        }
        return elm;
      });
    }

    function addAnswerMessage(message) {
      return addReceivedMessage(message, formatAnswerMessage);
    }

    function addErrorMessage(message) {
      return addReceivedMessage(message, formatErrorMessage, 'error');
    }

    return checkMessage(message)
      .then(addQuestionMessage)
      .then(parseKodiCommand)
      .then(callJsonRpcMethod)
      .then(addAnswerMessage)
      .then(q, addErrorMessage); // JSLint friendly instead of .catch()
  }

  function sendQueuedCommand() {
    var command = ktalkQueue.commands.shift();
    if (command) {
      return sendCommand(command, true).then(sendQueuedCommand);
    }
    ktalkQueue.answers.length = 0;
    ktalkBusy = false;
    return 'Finished.';
  }

  function talkToKodi(message) {
    return sendCommand(message).then(sendQueuedCommand);
  }

  function addInfoMessages(msg) {
    if (typeof msg === 'string') {
      msg = [msg];
    }
    msg.forEach(function (m) {
      ktalkMessages.addMessage(makeMessageProps(m, 'received'));
    });
  }

  function sendMessage(message) {
    message = message || ktalkMessagebar.value();
    if (ktalkBusy) {
      return qt(message, 300).then(sendMessage);
    }
    return (talkToKodi(message)).then(ktalkMessagebar.clear);
  }

  function addSampleKodiTalk() {
    return ['hello', 'version', 'what\'s up?'].reduce(function (p, c) {
      return p.then(function () {
        return talkToKodi(c);
      });
    }, q());
  }

  if (window.location.protocol.indexOf('http') === -1) {
    ktalkJsonRpcUrl = 'http://192.168.237.9:8080' + ktalkJsonRpcUrl;
    window.console.warn(window.location.protocol + '// connection. Using test server: ' + ktalkJsonRpcUrl);
  }

  // Global ajax options
  $$.ajaxSetup({
    processData: false,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // Fix for missing iPhone status bar in landscape mode
  ktalkApp.device.statusBar = false;
  $$('html').removeClass('with-statusbar-overlay');

  // Handle message
  $$('.messagebar .link').on('click', function () {
    sendMessage();
  });

  $$('.messagebar textarea').on('keypress', function (e) {
    e = e || window.event;
    if ((e.which || e.keyCode) === 13) {
      e.preventDefault();
      sendMessage();
    }
  });

  fixMessageTemplate();

  ktalkCommands = [{
    name: 'hello',
    regex: /^(hello)\s*[\.!\?]*$/i,
    handleResponse: 'Hello, I\'m a Kodi Talk bot.\n\nYou can send me an URI to play or another command (try to type "help" for the list of commands I understand)'
  }, {
    name: 'help',
    description: 'get the list of commands I understand.',
    regex: /^(help)\s*[\.!\?]*$/i,
    handleResponse: function () {
      var result = 'I understand the following commmands:';
      ktalkCommands.forEach(function (c) {
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
    handleResponse: function (m, c) {
      var file = transformPlayerUri(c.message.replace(c.regex, '$1'));
      ktalkQueue.commands.push('stop');
      ktalkQueue.commands.push('exec Player.Open {"item":{"file":"' + file + '"}}');
      ktalkQueue.commands.push('delay 1000');
      ktalkQueue.commands.push('answers.clear');
      ktalkQueue.commands.push('what\'s up');
      return 'Start playing URL: ' + file;
    }
  }, {
    name: 'play tv <channel>',
    description: 'start playing the given TV channel. For example, "play tv 1".\nUse "tv" command to get the list of TV channels.',
    regex: /^play\s+tv\s+(\d+)\s*[\.!\?]*$/i,
    handleResponse: function (m, c) {
      var id = c.message.replace(c.regex, '$1');
      ktalkQueue.commands.push('stop');
      ktalkQueue.commands.push('exec Player.Open {"item":{"channelid":' + id + '}}');
      ktalkQueue.commands.push('delay 1000');
      ktalkQueue.commands.push('answers.clear');
      ktalkQueue.commands.push('what\'s up');
      return 'Start playing TV channel #' + id;
    }
  }, {
    name: 'stop',
    description: 'stop playback.',
    regex: /^(stop)\s*[\.!\?]*$/i,
    method: 'Player.GetActivePlayers',
    params: '{}',
    handleResponse: function (m) {
      m.forEach(function (o) {
        ktalkQueue.commands.unshift('exec Player.Stop {"playerid":' + o.playerid + '}');
      });
      return m.length === 0 ? 'There is no active players.' : 'Stopping ' + m.length + ' player(s)';
    }
  }, {
    name: 'what\'s up',
    description: 'check what Kodi is doing now.',
    regex: /^(w(?:hat'?s\s*|ass|azz)up)\s*[\.!\?]*$/i,
    method: 'Player.GetActivePlayers',
    params: '{}',
    handleResponse: function (m) {
      m.forEach(function (o) {
        ktalkQueue.commands.push('player.getitem ' + o.playerid);
      });
      ktalkQueue.commands.push('answers.join ' + JSON.stringify('\n'));
      return m.length === 0 ? 'Nothing is playing now.' : 'Now playing:';
    }
  }, {
    name: 'player.getitem',
    regex: /^(player\.getitem)\s+(\d+)$/i,
    method: 'Player.GetItem',
    params: '{"playerid":$2,"properties":["artist","channeltype"]}',
    handleResponse: function (m) {
      return '‣' + (m.item.type && m.item.type !== 'unknown' ? (m.item.type === 'channel' ? ' ' + m.item.channeltype.toUpperCase() : '') + ' ' + m.item.type + ': ' : ' ') +
        (m.item.artist && m.item.artist.length ? m.item.artist.join(', ') + ' — ' : '') + m.item.label +
        (m.item.type === 'channel' ? ' (#' + m.item.id + ')' : '');
    }
  }, {
    name: 'tv',
    description: 'get the list of TV channels. You can add a string to filter the channels by name, for example, "tv discovery". For sorting the list by number, use "tv#" command.',
    regex: /^(tv#?)(?:$|\s+(.*)$)/i,
    method: 'PVR.GetChannels',
    params: '{"channelgroupid":"alltv"}',
    handleResponse: function (m, c) {
      var filter = c.message.replace(c.regex, '$2').toLowerCase(),
        sortById = (c.message.replace(c.regex, '$1').indexOf('#') >= 0),
        result = '';
      m.channels.sort(function (a, b) {
        if (sortById) {
          return a.channelid - b.channelid;
        }
        return a.label.localeCompare(b.label);
      });
      m.channels.forEach(function (ch) {
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
    params: '{"fullscreen":true}',
    handleResponse: function (m) {
      return m ? 'OK, fullscreen mode activated.' : 'Oops, still in GUI mode.';
    }
  }, {
    name: 'home',
    description: 'show the home screen.',
    regex: /^(home)\s*[\.!\?]*$/i,
    method: 'GUI.ActivateWindow',
    params: '{"window":"home"}'
  }, {
    name: 'weather',
    description: 'show the weather screen.',
    regex: /^(weather)\s*[\.!\?]*$/i,
    method: 'GUI.ActivateWindow',
    params: '{"window":"weather"}'
  }, {
    // !!! requires script.sleep addon by robwebset http://kodi.wiki/view/Add-on:Sleep
    name: 'sleep <N>',
    description: 'put Kodi to sleep after <N> minutes. Requires "Sleep" addon by robwebset.\nFor example, "sleep 30". Send "sleep 0" to disable sleep timer',
    regex: /^(sleep)\s+(\d+)\s*[\.!\?]*$/i,
    method: 'Addons.GetAddons',
    params: '{"type":"xbmc.addon.executable","enabled":true}',
    handleResponse: function (m, c) {
      var i, time = Math.round(parseInt(c.message.replace(c.regex, '$2'), 10) / 10);
      time = time < 0 ? 0 : (time > 6 ? 6 : time);
      if (m.addons.some(function (a) {
          return a.addonid === 'script.sleep';
        })) {
        ktalkQueue.commands.push('exec Addons.ExecuteAddon {"addonid":"script.sleep"}');
        ktalkQueue.commands.push('delay 1500');

        ktalkQueue.commands.push('exec Input.Left {}');
        for (i = 0; i < 7; ++i) {
          ktalkQueue.commands.push('exec Input.Select {}');
        }
        if (time) {
          ktalkQueue.commands.push('exec Input.Right {}');
          for (i = 0; i < time; ++i) {
            ktalkQueue.commands.push('exec Input.Select {}');
          }
        }
        ktalkQueue.commands.push('delay 1500');
        ktalkQueue.commands.push('exec Input.Back {}');
        return 'Set sleep timer to ' + time * 10 + ' min.';
      }
      return r('The required "Sleep" addon by robwebset is not installed.');
    }
  }, {
    name: 'version',
    description: 'get the Kodi version.',
    regex: /^(version)\s*[\.!\?]*$/i,
    method: 'Application.GetProperties',
    params: '{"properties":["name","version"]}',
    handleResponse: function (m) {
      ktalkQueue.commands.push('version.addon plugin.webinterface.ktalk');
      ktalkQueue.commands.push('answers.join ' + JSON.stringify('\n'));
      return m.name + ' ' + m.version.major + '.' + m.version.minor + (m.version.tag === 'releasecandidate' ? ' RC ' + m.version.tagversion : '') + ' (rev. ' + m.version.revision + ')';
    }
  }, {
    name: 'version.addon',
    regex: /^(version\.addon)\s+(.+)$/i,
    method: 'Addons.GetAddonDetails',
    params: '{"addonid":"$2","properties":["name","version"]}',
    handleResponse: function (m) {
      return m.addon.name + ' addon ' + m.addon.version;
    }
  }, {
    name: 'ping',
    description: 'check the availability of the Kodi web server.',
    regex: /^(ping)\s*[\.!\?]*$/i,
    method: 'JSONRPC.Ping',
    params: '{}'
  }, {
    name: 'say <message>',
    description: 'display the message on the Kodi screen.',
    regex: /^(say)\s+([\S\s]+?)\s*$/i,
    method: 'GUI.ShowNotification',
    params: function (m, c) {
      return '{"title":"Kodi Talk","message":' + JSON.stringify(m.replace(c.regex, '$2')) + '}';
    }
  }, {
    name: 'reboot',
    description: 'reboot the system running Kodi.',
    regex: /^(reboot)\s*[\.!\?]*$/i,
    method: 'System.Reboot',
    params: '{}'
  }, {
    name: 'shutdown',
    description: 'shutdown the system running Kodi.',
    regex: /^(shutdown)\s*[\.!\?]*$/i,
    method: 'System.Shutdown',
    params: '{}'
  }, {
    name: 'exec <method> <params>',
    description: 'for geeks only: execute the JSON-RPC <method> with <params>. For example,\n"exec GUI.ActivateWindow {"window":"home"}".',
    regex: /^exec\s+([\w\.]+)\s+(\S+)$/i,
    method: '$1',
    params: '$2'
  }, {
    name: 'delay',
    regex: /^(delay)\s+(\d+)$/i,
    handleResponse: function (m, c) {
      var ms = parseInt(c.message.replace(c.regex, '$2'), 10);
      return qt('Waiting ' + ms + ' ms.', ms);
    }
  }, {
    name: 'answers.clear',
    regex: /^(answers\.clear)$/i,
    handleResponse: function (m, c) {
      ktalkQueue.answers.length = 0;
      return '';
    }
  }, {
    name: 'answers.join',
    regex: /^(answers\.join)\s+(.+)$/i,
    handleResponse: function (m, c) {
      var d = c.message.replace(c.regex, '$2');
      d = d.indexOf('\"') === 0 ? JSON.parse(d) : d;
      return ktalkQueue.answers.join(d);
    }
  }, {
    name: 'debug <js expression>',
    regex: /^(debug)\s+(.+)$/i,
    handleResponse: function (m, c) {
      var val = c.message.replace(c.regex, '$2');
      return '# ' + val + ' =\n' + JSON.stringify(eval(val), null, 2);
    }
  }];

  addSampleKodiTalk();
  if (!ktalkApp.device.os) {
    setTimeout(function () {
      $$('.messagebar textarea').focus();
    }, 100);
  }
}());
