/*global Framework7: false, Dom7: false, Template7:false, Promise:false*/
(function () {
  'use strict';

  var ktalkApp = new Framework7(),
    $$ = Dom7,
    ktalkMessages = ktalkApp.messages('.messages', {
      autoLayout: true
    }),
    ktalkMessagebar = ktalkApp.messagebar('.messagebar'),
    ktalkAvaRecv = 'img/apple-touch-icon-114x114.png',
    ktalkAvaSent = 'img/i-form-name-ios-114x114.png',
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

  function makeMsgProps(text, type) {
    var props = {
        type: type,
        text: text
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
      ktalkMessages.addMessage(makeMsgProps(m, 'sent'));
      return m;
    }

    function parseKodiCommand(message) {
      // TODO Parse commands
      if (message.indexOf('@exec') === 0) {
        var tokens = /^@\w+\s+([\w\.]+)\s+(\S+)$/.exec(message);
        if (tokens) {
          return {
            method: tokens[1],
            params: JSON.parse(tokens[2])
          };
        }
      }
      return r('Sorry, I can\'t understand You. I will learn more commands soon.');
    }

    function formatAnswerMessage(m) {
      if (typeof m === 'string') {
        return m + '!';
      }
      return 'OK, the answer is: ' + JSON.stringify(m);
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
      ktalkMessages.addMessage(makeMsgProps(m, 'received'));
      return m;
    }

    function addErrorMessage(m) {
      m = formatErrorMessage(m);
      if (m.length > 0) {
        ktalkMessages.addMessage(makeMsgProps(m, 'received')).classList.add('error');
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
    var msgs = ['Hello, I am Kodi Talk Bot.', 'You cand send me URI to play or any command (try to type "help" for the list of commands I understand)'];
    msgs.map(function (msg) {
      ktalkMessages.addMessage(makeMsgProps(msg, 'received'));
    });
  }

  function addSampleKodiTalk() {
    var st = [{
      m: "JSONRPC.Ping",
      p: {}
    }, {
      m: "JSONRPC.Pong",
      p: {}
    }, {
      m: "JSONRPC.Version",
      p: {}
    }, {
      m: "Application.GetProperties",
      p: {
        "properties": ["name", "version"]
      }
    }];

    // Send messages in a sequential manner
    st.reduce(function (p, t) {
      return p.then(function () {
        return talkToKodi(['@exec ', t.m, JSON.stringify(t.p)].join(' '));
      });
    }, q());
  }

  // Handle message
  $$('.messagebar .link').on('click', function () {
    talkToKodi(ktalkMessagebar.value());
    ktalkMessagebar.clear();
  });

  fixMessageTemplate();
  addGreetingMessage();
  addSampleKodiTalk();
}());
