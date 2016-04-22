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
      name: 'ping',
      description: 'check the availability of the Kodi web server',
      regex: /^(ping)/i,
      method: 'JSONRPC.Ping',
      params: '{}'
    }, {
      name: 'play <url>',
      description: 'start playing the given URL. For example,\n"play http://www.sample-videos.com/video/mp4/720/big_buck_bunny_720p_50mb.mp4",\n"play https://youtu.be/YE7VzlLtp-4",\nor simply "https://youtu.be/YE7VzlLtp-4"',
      regex: /^(?:play)?\s*((?:https?|plugin):\/\/.+)/i,
      method: 'Player.Open',
      params: function (m, c) {
        return '{"item":{"file":"' + transformPlayerUri(m.replace(c.regex, '$1')) + '"}}';
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
    }],
    lastMessageTime = 0;

  function q(v) {
    // console.log('Promise: ' + v);
    return Promise.resolve(v);
  }

  function r(v) {
    // console.log('Reject: ' + v);
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

    function parseKodiCommand(message) {

      function makeProperty(command, propName, toJson) {
        var result;
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

      function makeHelpText() {
        var result = 'I understand the following commmands:';
        ktalkCommands.forEach(function (c) {
          result += '\n\n‣ ' + c.name + ' — ' + c.description;
        });
        return result;
      }

      // TODO Parse commands
      if (/^(help)/i.test(message)) {
        // print help message
        ktalkMessages.addMessage(makeMessageProps(makeHelpText(), 'received'));
        return r(''); // silent error
      }
      var request;
      ktalkCommands.forEach(function (c) {
        if (typeof request !== 'undefined') {
          return;
        }
        var tokens = c.regex.exec(message);
        if (tokens) {
          request = {
            method: makeProperty(c, 'method'),
            params: makeProperty(c, 'params', true)
              // params: JSON.parse((typeof c.transform === 'function' ? c.transform(message) : message).replace(c.regex, c.params))
          };
        }
      });
      if (typeof request !== 'undefined') {
        return request;
      }
      return r('Sorry, I can\'t understand you. I will learn more commands soon.');
    }

    function formatAnswerMessage(m) {
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
        ktalkMessages.addMessage(makeMessageProps(m, 'received')).classList.add('error');
      }
      return m;
    }

    return checkMessage(message)
      .then(addQuestionMessage)
      .then(parseKodiCommand)
      .then(window.kodi.call)
      .then(addAnswerMessage, addErrorMessage);
  }

  function addGreetingMessage() {
    var msgs = ['Hello, I\'m a Kodi Talk bot.', 'You can send me an URI to play or another command (try to type "help" for the list of commands I understand)'];
    msgs.map(function (msg) {
      ktalkMessages.addMessage(makeMessageProps(msg, 'received'));
    });
  }

  function addSampleKodiTalk() {
    var st = [
      'ping',
      'help',
      'exec JSONRPC.Version {}',
      'exec Application.GetProperties {"properties":["name","version"]}',
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

  function isMobile() {
    // code from http://detectmobilebrowsers.com
    var ua = navigator.userAgent || navigator.vendor || window.opera;
    if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(ua) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(ua.substr(0, 4))) {
      return true;
    }
    return false;
  }

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
  addGreetingMessage();
  // addSampleKodiTalk();
  if (!isMobile()) {
    setTimeout(function () {
      $$('.messagebar textarea').focus();
    }, 100);
  }
}());
