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
    ktalkAvaRecv = 'img/apple-touch-icon-114x114.png',
    ktalkAvaSent = 'img/i-form-name-ios-114x114.png',
    ktalkCommands = [],
    ktalkQueue = [],
    ktalkBusy = false,
    lastMessageTime = 0;

  function q(v) {
    return Promise.resolve(v);
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

  function talkToKodi(message, silent) {
    var command; // current command

    function checkMessage(m) {
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
          command = {
            message: message,
            name: c.name,
            description: c.description,
            regex: c.regex,
            method: request.method,
            params: request.params,
            format: c.format
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

    function formatAnswerMessage(m) {
      var result;
      if (typeof command.format !== 'undefined') {
        result = parseProperty(m, command, 'format');
      } else if (typeof m === 'string') {
        result = m + '!';
      } else {
        result = 'OK, the answer is:\n\n' + formatJson(m);
      }
      return ktalkQueue.length ? '' : result;
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

    ktalkBusy = true;
    return checkMessage(message)
      .then(addQuestionMessage)
      .then(parseKodiCommand)
      .then(window.kodi.call)
      .then(addAnswerMessage, addErrorMessage)
      .then(function () {
        var command = ktalkQueue.shift();
        if (command) {
          return new Promise(function (resolve, reject) {
            setTimeout(function () {
              // console.log('Next command in queue: ' + command);
              resolve(talkToKodi(command, true));
            }, 100);
          });
        }
        ktalkBusy = false;
        return 'End.';
      });
  }

  function addInfoMessages(msg) {
    if (typeof msg === 'string') {
      msg = [msg];
    }
    msg.forEach(function (m) {
      ktalkMessages.addMessage(makeMessageProps(m, 'received'));
    });
  }

  function addGreeting() {
    addInfoMessages(['Hello, I\'m a Kodi Talk bot.', 'You can send me an URI to play or another command (try to type "help" for the list of commands I understand)']);
  }

  function addSampleKodiTalk() {
    var st = [
      'help',
      'ping',
      'version',
      'hello'
//      'https://youtu.be/YE7VzlLtp-4'
    ];
    // Send messages in a sequential manner
    return st.reduce(function (p, c) {
      return p.then(function () {
        return talkToKodi(c);
      });
    }, q());
  }

  function sendMessage() {
    if (ktalkBusy) {
      setTimeout(sendMessage, 300);
      return;
    }
    talkToKodi(ktalkMessagebar.value());
    ktalkMessagebar.clear();
  }

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
    name: 'help',
    description: 'get the list of commands I understand.',
    regex: /^(help)/i,
    format: function () {
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
    regex: /^(?:play)?\s*((?:https?|plugin):\/\/.+)/i,
    method: 'Player.GetActivePlayers',
    params: '{}',
    format: function (m, c) {
      var params = '{"item":{"file":"' + transformPlayerUri(c.message.replace(c.regex, '$1')) + '"}}';

      m.forEach(function (o) {
        ktalkQueue.push('exec Player.Stop {"playerid":' + o.playerid + '}');
      });
      ktalkQueue.push('exec Player.Open ' + params);
      return '';
    }
  }, {
    name: 'play tv <channel>',
    description: 'start playing the given TV channel. For example, "play tv 1".\nUse "tv" command to get the list of TV channels.',
    regex: /^play\s+tv\s+(\d+)$/i,
    method: 'Player.GetActivePlayers',
    params: '{}',
    format: function (m, c) {
      var params = '{"item":{"channelid":' + transformPlayerUri(c.message.replace(c.regex, '$1')) + '}}';

      m.forEach(function (o) {
        ktalkQueue.push('exec Player.Stop {"playerid":' + o.playerid + '}');
      });
      ktalkQueue.push('exec Player.Open ' + params);
      return '';
    }
  }, {
    name: 'stop',
    description: 'Stop playback.',
    regex: /^(stop)/i,
    method: 'Player.GetActivePlayers',
    params: '{}',
    format: function (m) {
      m.forEach(function (o) {
        ktalkQueue.push('exec Player.Stop {"playerid":' + o.playerid + '}');
      });
      return m.length === 0 ? 'There is no active players.' : '';
    }
  }, {
    name: 'ping',
    description: 'check the availability of the Kodi web server.',
    regex: /^(ping)/i,
    method: 'JSONRPC.Ping',
    params: '{}'
  }, {
    name: 'version',
    description: 'get the Kodi version.',
    regex: /^(version)/i,
    method: 'Application.GetProperties',
    params: '{"properties":["name","version"]}',
    format: function (m) {
      return m.name + ' ' + m.version.major + '.' + m.version.minor + (m.version.tag === 'releasecandidate' ? ' RC ' + m.version.tagversion : '') + ' (rev. ' + m.version.revision + ')';
    }
  }, {
    name: 'home',
    description: 'show the home screen.',
    regex: /^(home)/i,
    method: 'GUI.ActivateWindow',
    params: '{"window":"home"}'
  }, {
    name: 'weather',
    description: 'show the weather screen.',
    regex: /^(weather)/i,
    method: 'GUI.ActivateWindow',
    params: '{"window":"weather"}'
  }, {
    name: 'tv',
    description: 'get the list of TV channels. You can add a string to filter the channels by name, for example, "tv discovery". For sorting the list by number, use "tv#" command.',
    regex: /^(tv#?)(?:$|\s+(.*)$)/i,
    method: 'PVR.GetChannels',
    params: '{"channelgroupid":"alltv"}',
    format: function (m, c) {
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
    name: 'exec <method> <params>',
    description: 'for geeks only: execute the JSON-RPC <method> with <params>. For example,\n"exec GUI.ActivateWindow {"window":"home"}".',
    regex: /^exec\s+([\w\.]+)\s+(\S+)/i,
    method: '$1',
    params: '$2'
  }, {
    name: 'debug <js object>',
    regex: /^debug\s+(.+)/i,
    format: function (m, c) {
      var val = c.message.replace(c.regex, '$1');
      return '# ' + val + ' =\n' + JSON.stringify(eval(val), null, 2);
    }
  }];

  addGreeting();
  // addSampleKodiTalk();
  if (!ktalkApp.device.os) {
    setTimeout(function () {
      $$('.messagebar textarea').focus();
    }, 100);
  }
}());
