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
    ktalkCommands = [{
      name: 'help',
      description: 'get the list of commands I understand',
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
      description: 'start playing the given URL. For example,\n"play http://www.sample-videos.com/video/mp4/720/big_buck_bunny_720p_50mb.mp4",\n"play https://youtu.be/YE7VzlLtp-4",\nor simply "https://youtu.be/YE7VzlLtp-4"',
      regex: /^(?:play)?\s*((?:https?|plugin):\/\/.+)/i,
      method: 'Player.Open',
      params: function (m, c) {
        return '{"item":{"file":"' + transformPlayerUri(m.replace(c.regex, '$1')) + '"}}';
      }
    }, {
      name: 'ping',
      description: 'check the availability of the Kodi web server',
      regex: /^(ping)/i,
      method: 'JSONRPC.Ping',
      params: '{}'
    }, {
      name: 'version',
      description: 'get the Kodi version',
      regex: /^(version)/i,
      method: 'Application.GetProperties',
      params: '{"properties":["name","version"]}',
      format: function (m) {
        return m.name + ' ' + m.version.major + '.' + m.version.minor + (m.version.tag === 'releasecandidate' ? ' RC ' + m.version.tagversion : '') + ' (rev. ' + m.version.revision + ')';
      }
    }, {
      name: 'home',
      description: 'show the home screen',
      regex: /^(home)/i,
      method: 'GUI.ActivateWindow',
      params: '{"window":"home"}'
    }, {
      name: 'weather',
      description: 'show the weather screen',
      regex: /^(weather)/i,
      method: 'GUI.ActivateWindow',
      params: '{"window":"weather"}'
    }, {
      name: 'exec <method> <params>',
      description: 'for geeks only: execute the JSON-RPC <method> with <params>. For example,\n"exec GUI.ActivateWindow {"window":"home"}"',
      regex: /^exec\s+([\w\.]+)\s+(\S+)/i,
      method: '$1',
      params: '$2'
    }, {
      name: 'debug <js object>',
      regex: /^debug\s+(.+)/i,
      format: function (m, c) {
        var v = m.replace(c.regex, '$1');
        return '#DEBUG ' + v + ' =\n' + JSON.stringify(eval(m.replace(c.regex, '$1')), null, 2);
      }
    }],
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

  function talkToKodi(message) {
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
      ktalkMessages.addMessage(makeMessageProps(m, 'sent'));
      return m;
    }

    function parseProperty(message, command, propName, toJson) {
      var result;
      if (typeof command[propName] === 'undefined') {
        return;
      }
      if (typeof command[propName] === 'function') {
        result = command[propName](message, command);
        if (typeof result === 'object' && !toJson) {
          return JSON.stringify(result);
        }
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
            name: c.name,
            description: c.description,
            regex: c.regex,
            method: request.method,
            params: request.params,
            format: (typeof request.method === 'undefined') ? parseProperty(message, c, 'format') : c.format
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
      if (typeof command.format !== 'undefined') {
        return parseProperty(m, command, 'format');
      }
      if (typeof m === 'string') {
        return m + '!';
      }
      return 'OK, the answer is:\n\n' + formatJson(m);
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

    function addAnswerMessage(m) {
      m = formatAnswerMessage(m);
      ktalkMessages.addMessage(makeMessageProps(m, 'received'));
      return m;
    }

    function addErrorMessage(m) {
      m = formatErrorMessage(m);
      if (m.length > 0) {
        ktalkMessages.addMessage(makeMessageProps(m, 'received')).classList.add(m.indexOf('#') === 0 ? 'debug' : 'error');
      }
      return m;
    }

    return checkMessage(message)
      .then(addQuestionMessage)
      .then(parseKodiCommand)
      .then(window.kodi.call)
      .then(addAnswerMessage, addErrorMessage);
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
    ];
    // Send messages in a sequential manner
    st.reduce(function (p, c) {
      return p.then(function () {
        return talkToKodi(c);
      });
    }, q());
  }

  function sendMessage() {
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
  addGreeting();
  // addInfoMessages([formatJson(ktalkApp.device)]);
  // addSampleKodiTalk();
  if (!ktalkApp.device.os) {
    setTimeout(function () {
      $$('.messagebar textarea').focus();
    }, 100);
  }
}());
