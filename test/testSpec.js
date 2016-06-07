/*global jasmine, expect, describe, xdescribe, it, beforeEach, afterEach, spyOn*/
/*global Framework7*/
/*jshint -W053*/

describe('kTalk', function kTalk_0() {
  'use strict';

  var $$ = window.kTalk;

  function getCommand(name) {
    return $$.commands.find(function (c) {
      return c.name === name;
    });
  }

  function clone(source, members) {
    var result = {};

    members.forEach(function (m) {
      result[m] = source[m];
    });
    return result;
  }

  describe('Initialization', function initialization_0() {

    it('kTalk should be an object', function initialization_1() {
      expect($$).toEqual(jasmine.any(Object));
    });

    it('f7App should be a Framework7 object', function initialization_2() {
      expect(window.f7App).toEqual(jasmine.any(Framework7));
    });

    it('d7 should be a function', function initialization_3() {
      expect(window.d7).toEqual(jasmine.any(Function));
    });

    it('kTalk.messages should be initialized', function initialization_4() {
      expect($$.messages).toEqual(jasmine.any(Object));
      expect($$.messages.container[0]).toEqual(jasmine.any(window.HTMLDivElement));
      expect($$.messages.container[0].nodeType).toBe(1);
      expect($$.messages.params.autoLayout).toBe(true);
      expect($$.messages.params.messageTemplate).toMatch(/\{\{day\}\}\{\{#if time\}\},/);
      expect($$.messages.template({
        text: 'Hello',
        type: 'sent',
        day: 'Friday, May 4',
        time: '12:30',
        avatar: 'avatar.png'
      })).toMatch(/<div.*?>Friday, May 4, <span>12:30<\/span><\/div>.*sent.*Hello.*avatar\.png/);
      expect($$.messages.params.newMessagesFirst).toBe(false);
    });

    it('kTalk.messagebar should be initialized', function initialization_5() {
      expect($$.messagebar).toEqual(jasmine.any(Object));
      expect($$.messagebar.container[0]).toEqual(jasmine.any(window.HTMLDivElement));
      expect($$.messagebar.container[0].nodeType).toBe(1);
      expect($$.messagebar.textarea[0]).toEqual(jasmine.any(window.HTMLTextAreaElement));
      expect($$.messagebar.textarea[0].nodeType).toBe(1);
    });

    it('kTalk\'s members of primitive data types shold be initialized', function initialization_6() {
      expect($$.jsonRpcUrl).toEqual(jasmine.any(String));
      expect($$.avaRecv).toEqual(jasmine.any(String));
      expect($$.avaSent).toEqual(jasmine.any(String));
      expect($$.busy).toBe(false);
      expect($$.commandId).toBe(0);
      expect($$.lastMessageTime).toBe(0);
    });

    it('kTalk.commands should be initialized', function initialization_7() {
      expect($$.commands).toEqual(jasmine.any(Array));
      expect($$.commands.length).toBeGreaterThan(2);

      $$.commands.forEach(function (c) {
        expect(['name', 'description', 'regex', 'method', 'params', 'answer']).toEqual(jasmine.arrayContaining(Object.keys(c)));
        expect(c.name).toEqual(jasmine.any(String));
        expect(c.description || '').toEqual(jasmine.any(String));
        expect(c.regex).toEqual(jasmine.any(RegExp));
        expect(c.method || '').toEqual(jasmine.any(String));
        expect(['function', 'object', 'string', 'undefined']).toEqual(jasmine.arrayContaining([typeof c.params]));
        expect(['function', 'string', 'undefined']).toEqual(jasmine.arrayContaining([typeof c.answer]));
      });
    });

    it('kTalk.queue should be initialized', function initialization_8() {
      expect($$.queue).toEqual(jasmine.any(Object));
      expect($$.queue.commands).toEqual(jasmine.any(Array));
      expect($$.queue.commands.length).toBe(0);
      expect($$.queue.answers).toEqual(jasmine.any(Array));
      expect($$.queue.answers.length).toBe(0);
    });

  });

  describe('.testing (private methods)', function lib_0() {

    describe('.q()', function q_0() {

      it('should return resolved promise with the given value', function q_1(done) {
        $$.testing.q('Resolved').then(function (v) {
          expect(v).toBe('Resolved');
          done();
        });
      });

    });

    describe('.qt()', function qt_0() {

      it('should return resolved promise with the given value', function qt_1(done) {
        $$.testing.qt('Resolved', 1).then(function (v) {
          expect(v).toBe('Resolved');
          done();
        });
      });

      it("promise should be resolved after 50 ms", function qt_2(done) {
        var delay = 50,
          startTime = Date.now();
        $$.testing.qt('Resolved', delay).then(function (v) {
          expect(Date.now() - startTime).toBeCloseTo(delay, -2);
          done();
        });
      });

      it("promise should be resolved after 500 ms (default)", function qt_3(done) {
        var delay = 500,
          startTime = Date.now();
        $$.testing.qt('Resolved').then(function (v) {
          expect(Date.now() - startTime).toBeCloseTo(delay, -2);
          done();
        });
      });

    });

    describe('.r()', function r_0() {

      it('should return rejected promise with the given value', function r_1(done) {
        $$.testing.r('Rejected').then(null, function (v) {
          expect(v).toBe('Rejected');
          done();
        });
      });

    });

    describe('.capitalize()', function capitalize_0() {

      it('should return string with the 1st letter in upper case', function capitalize_1() {
        expect($$.testing.capitalize('S')).toBe('S');
        expect($$.testing.capitalize('s')).toBe('S');
        expect($$.testing.capitalize('string')).toBe('String');
      });

      it('should return rest of the string in lower case', function capitalize_2() {
        expect($$.testing.capitalize('STRING')).toBe('String');
        expect($$.testing.capitalize('sTrInG')).toBe('String');
      });

    });

    describe('.formatDay()', function formatDay_0() {

      it('should format date as "Day, Mon #"', function formatDay_1() {
        expect($$.testing.formatDay()).toMatch(/^[A-Z][a-z]+, [A-Z][a-z]+ \d{1,2}$/);
        expect($$.testing.formatDay(new Date(2001, 0, 1))).toBe('Monday, Jan 1');
        expect($$.testing.formatDay(new Date(2001, 1, 6))).toBe('Tuesday, Feb 6');
        expect($$.testing.formatDay(new Date(2001, 2, 7))).toBe('Wednesday, Mar 7');
        expect($$.testing.formatDay(new Date(2001, 3, 5))).toBe('Thursday, Apr 5');
        expect($$.testing.formatDay(new Date(2001, 4, 4))).toBe('Friday, May 4');
        expect($$.testing.formatDay(new Date(2001, 5, 2))).toBe('Saturday, Jun 2');
        expect($$.testing.formatDay(new Date(2001, 6, 1))).toBe('Sunday, Jul 1');
        expect($$.testing.formatDay(new Date(2001, 7, 18))).toBe('Saturday, Aug 18');
        expect($$.testing.formatDay(new Date(2001, 8, 21))).toBe('Friday, Sep 21');
        expect($$.testing.formatDay(new Date(2001, 9, 25))).toBe('Thursday, Oct 25');
        expect($$.testing.formatDay(new Date(2001, 10, 28))).toBe('Wednesday, Nov 28');
        expect($$.testing.formatDay(new Date(2001, 11, 11))).toBe('Tuesday, Dec 11');
      });

    });

    describe('.formatTime()', function formatTime_0() {

      it('should format time as "##:##"', function formatTime_1() {
        expect($$.testing.formatTime()).toMatch(/^\d\d:\d\d$/);
        expect($$.testing.formatTime(new Date(2001, 0, 1))).toBe('00:00');
        expect($$.testing.formatTime(new Date(2001, 0, 1, 1, 1, 1))).toBe('01:01');
        expect($$.testing.formatTime(new Date(2001, 0, 1, 12, 30, 0))).toBe('12:30');
        expect($$.testing.formatTime(new Date(2001, 0, 1, 23, 59, 59))).toBe('23:59');
      });

    });

    describe('.formatDate()', function formatDate_0() {

      it('should format date-time as "Day, Mon #, <span>##:##</span>"', function formatDate_1() {
        expect($$.testing.formatDate()).toMatch(/^[A-Z][a-z]+, [A-Z][a-z]+ \d{1,2}, <span>\d\d:\d\d<\/span>$/);
        expect($$.testing.formatDate(new Date(2001, 0, 1))).toBe('Monday, Jan 1, <span>00:00</span>');
        expect($$.testing.formatDate(new Date(2001, 0, 1, 1, 1, 1))).toBe('Monday, Jan 1, <span>01:01</span>');
        expect($$.testing.formatDate(new Date(2001, 0, 1, 12, 30, 0))).toBe('Monday, Jan 1, <span>12:30</span>');
        expect($$.testing.formatDate(new Date(2001, 0, 1, 23, 59, 59))).toBe('Monday, Jan 1, <span>23:59</span>');
      });

    });

    describe('.formatJson()', function formatJson_0() {

      it('should simplify JSON format', function formatJson_1() {
        expect($$.testing.formatJson(true)).toBe('true');
        expect($$.testing.formatJson(0)).toBe('0');
        expect($$.testing.formatJson('A string')).toBe('A string');
        expect($$.testing.formatJson('Multiline string\nSecond line')).toBe('Multiline string\\nSecond line');
        expect($$.testing.formatJson({
          a: true,
          b: 0,
          c: 'A string',
          d: {
            da: 'One',
            db: 'Two'
          }
        })).toBe('    a: true\n    b: 0\n    c: A string\n    d:\n        da: One\n        db: Two');
        expect($$.testing.formatJson(['One', 'Two', 'Three', 'Four'])).toBe('(\n    One\n    Two\n    Three\n    Four\n)');
        expect($$.testing.formatJson({
          channels: [{
            channelid: 1,
            label: "1+1"
          }, {
            channelid: 2,
            label: "2x2"
          }, {
            channelid: 3,
            label: "3 To 3"
          }]
        })).toBe('    channels: (\n            channelid: 1\n            label: 1+1\n\n            channelid: 2\n            label: 2x2\n\n            channelid: 3\n            label: 3 To 3\n    )');
      });

    });

    describe('.encodeHtmlEntities()', function encodeHtmlEntities_0() {

      it('should escape all potentially dangerous characters', function encodeHtmlEntities_1() {
        expect($$.testing.encodeHtmlEntities('&')).toBe('&amp;');
        expect($$.testing.encodeHtmlEntities('<')).toBe('&lt;');
        expect($$.testing.encodeHtmlEntities('>')).toBe('&gt;');
        expect($$.testing.encodeHtmlEntities('!@#$%^&*()_+-={}[]:";\'<>?,./`~ \n\u0000\r\u0127')).toBe('!@#$%^&amp;*()_+-={}[]:&#34;;\'&lt;&gt;?,./`~ &#10;&#0;&#13;&#295;');
        expect($$.testing.encodeHtmlEntities('𐀀𐀁𐀂𐀃')).toBe('&#65536;&#65537;&#65538;&#65539;');
      });

    });

    describe('.transformPlayerUri()', function transformPlayerUri_0() {

      it('should transform Youtube URLs', function transformPlayerUri_1() {
        expect($$.testing.transformPlayerUri('http://www.youtube.com/?feature=player_embedded&v=dQw4w9WgXcQ')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=dQw4w9WgXcQ');
        expect($$.testing.transformPlayerUri('http://www.youtube.com/?v=dQw4w9WgXcQ')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=dQw4w9WgXcQ');
        expect($$.testing.transformPlayerUri('http://www.youtube.com/e/dQw4w9WgXcQ')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=dQw4w9WgXcQ');
        expect($$.testing.transformPlayerUri('http://www.youtube.com/embed/0zM3nApSvMg?rel=0"')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=0zM3nApSvMg');
        expect($$.testing.transformPlayerUri('http://www.youtube.com/embed/0zM3nApSvMg?rel=0')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=0zM3nApSvMg');
        expect($$.testing.transformPlayerUri('http://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=dQw4w9WgXcQ');
        expect($$.testing.transformPlayerUri('http://www.youtube.com/embed/nas1rJpm7wY?rel=0')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=nas1rJpm7wY');
        expect($$.testing.transformPlayerUri('http://www.youtube.com/embed/NLqTHREEVbY')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=NLqTHREEVbY');
        expect($$.testing.transformPlayerUri('http://www.youtube.com/user/IngridMichaelsonVEVO#p/a/u/1/KdwsulMb8EQ')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=KdwsulMb8EQ');
        expect($$.testing.transformPlayerUri('http://www.youtube.com/user/IngridMichaelsonVEVO#p/a/u/1/QdK8U-VIH_o')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=QdK8U-VIH_o');
        expect($$.testing.transformPlayerUri('http://www.youtube.com/user/IngridMichaelsonVEVO#p/u/11/KdwsulMb8EQ')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=KdwsulMb8EQ');
        expect($$.testing.transformPlayerUri('http://www.youtube.com/user/Scobleizer#p/u/1/1p3NINEsYGo')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=1p3NINEsYGo');
        expect($$.testing.transformPlayerUri('http://www.youtube.com/user/Scobleizer#p/u/1/1p3vcRhsYGo')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=1p3vcRhsYGo');
        expect($$.testing.transformPlayerUri('http://www.youtube.com/user/Scobleizer#p/u/1/1p3vcRhsYGo?rel=0')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=1p3vcRhsYGo');
        expect($$.testing.transformPlayerUri('http://www.youtube.com/user/Scobleizer#p/u/1/1p3vONEsYGo')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=1p3vONEsYGo');
        expect($$.testing.transformPlayerUri('http://www.youtube.com/user/Scobleizer#p/u/1/1pSEVENsYGo')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=1pSEVENsYGo');
        expect($$.testing.transformPlayerUri('http://www.youtube.com/user/SilkRoadTheatre#p/a/u/2/6dwqZw0j_jY')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=6dwqZw0j_jY');
        expect($$.testing.transformPlayerUri('http://www.youtube.com/v/0zM3nApSvMg?fs=1&amp;hl=en_US&amp;rel=0')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=0zM3nApSvMg');
        expect($$.testing.transformPlayerUri('http://www.youtube.com/v/0zM3nApSvMg?fs=1&hl=en_US&rel=0')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=0zM3nApSvMg');
        expect($$.testing.transformPlayerUri('http://www.youtube.com/v/dQw4w9WgXcQ')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=dQw4w9WgXcQ');
        expect($$.testing.transformPlayerUri('http://www.youtube.com/v/NLqAFFIVEbY?fs=1&hl=en_US')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=NLqAFFIVEbY');
        expect($$.testing.transformPlayerUri('http://www.youtube.com/watch?feature=feedrec_grec_index&v=0zM3nApSvMg')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=0zM3nApSvMg');
        expect($$.testing.transformPlayerUri('http://www.youtube.com/watch?feature=player_detailpage&v=8UVNT4wvIGY')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=8UVNT4wvIGY');
        expect($$.testing.transformPlayerUri('http://www.youtube.com/watch?feature=player_embedded&v=dQw4w9WgXcQ')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=dQw4w9WgXcQ');
        expect($$.testing.transformPlayerUri('http://www.youtube.com/watch?v=0zM3nApSvMg#t=0m10s')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=0zM3nApSvMg');
        expect($$.testing.transformPlayerUri('http://www.youtube.com/watch?v=0zM3nApSvMg&feature=feedrec_grec_index')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=0zM3nApSvMg');
        expect($$.testing.transformPlayerUri('http://www.youtube.com/watch?v=0zM3nApSvMg')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=0zM3nApSvMg');
        expect($$.testing.transformPlayerUri('http://www.youtube.com/watch?v=0zM3nApSvMg/')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=0zM3nApSvMg');
        expect($$.testing.transformPlayerUri('http://www.youtube.com/watch?v=6dwqZw0j_jY&feature=youtu.be')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=6dwqZw0j_jY');
        expect($$.testing.transformPlayerUri('http://www.youtube.com/watch?v=cKZDdG9FTKY&feature=channel')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=cKZDdG9FTKY');
        expect($$.testing.transformPlayerUri('http://www.youtube.com/watch?v=dQw4w9WgXcQ&feature=youtube_gdata_player')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=dQw4w9WgXcQ');
        expect($$.testing.transformPlayerUri('http://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=dQw4w9WgXcQ');
        expect($$.testing.transformPlayerUri('http://www.youtube.com/watch?v=JYATEN_TzhA&feature=featured')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=JYATEN_TzhA');
        expect($$.testing.transformPlayerUri('http://www.youtube.com/watch?v=NLqASIXrVbY')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=NLqASIXrVbY');
        expect($$.testing.transformPlayerUri('http://www.youtube.com/watch?v=peFZbP64dsU')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=peFZbP64dsU');
        expect($$.testing.transformPlayerUri('http://www.youtube.com/watch?v=yZ-K7nCVnBI&playnext_from=TL&videos=osPknwzXEas&feature=sub')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=yZ-K7nCVnBI');
        expect($$.testing.transformPlayerUri('http://www.youtube.com/ytscreeningroom?v=NRHEIGHTx8I')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=NRHEIGHTx8I');
        expect($$.testing.transformPlayerUri('http://www.youtube.com/ytscreeningroom?v=NRHVzbJVx8I')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=NRHVzbJVx8I');
        expect($$.testing.transformPlayerUri('http://youtu.be/0zM3nApSvMg')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=0zM3nApSvMg');
        expect($$.testing.transformPlayerUri('http://youtu.be/6dwqZw0j_jY')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=6dwqZw0j_jY');
        expect($$.testing.transformPlayerUri('http://youtu.be/afa-5HQHiAs')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=afa-5HQHiAs');
        expect($$.testing.transformPlayerUri('http://youtu.be/dQw4w9WgXcQ')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=dQw4w9WgXcQ');
        expect($$.testing.transformPlayerUri('http://youtu.be/dQw4w9WgXcQ?feature=youtube_gdata_player')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=dQw4w9WgXcQ');
        expect($$.testing.transformPlayerUri('http://youtu.be/NLqAFTWOVbY')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=NLqAFTWOVbY');
        expect($$.testing.transformPlayerUri('http://youtu.be/vfGY-laqamA')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=vfGY-laqamA');
        expect($$.testing.transformPlayerUri('http://youtube.com/?v=dQw4w9WgXcQ&feature=youtube_gdata_player')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=dQw4w9WgXcQ');
        expect($$.testing.transformPlayerUri('http://youtube.com/?vi=dQw4w9WgXcQ&feature=youtube_gdata_player')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=dQw4w9WgXcQ');
        expect($$.testing.transformPlayerUri('http://youtube.com/v/dQw4w9WgXcQ?feature=youtube_gdata_player')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=dQw4w9WgXcQ');
        expect($$.testing.transformPlayerUri('http://youtube.com/vi/dQw4w9WgXcQ?feature=youtube_gdata_player')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=dQw4w9WgXcQ');
        expect($$.testing.transformPlayerUri('http://youtube.com/watch?v=dQw4w9WgXcQ&feature=youtube_gdata_player')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=dQw4w9WgXcQ');
        expect($$.testing.transformPlayerUri('http://youtube.com/watch?vi=dQw4w9WgXcQ&feature=youtube_gdata_player')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=dQw4w9WgXcQ');
        expect($$.testing.transformPlayerUri('https://www.youtube.com/watch?v=S09F5MejfBE')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=S09F5MejfBE');
      });

      it('should not transform other URLs', function transformPlayerUri_1() {
        expect($$.testing.transformPlayerUri('http://www.sample-videos.com/video/mp4/720/big_buck_bunny_720p_50mb.mp4')).toBe('http://www.sample-videos.com/video/mp4/720/big_buck_bunny_720p_50mb.mp4');
      });

    });

    describe('.getMessageToken()', function getMessageToken_0() {

      it('should return the token by number from the command message', function getMessageToken_1() {
        var command = {
          message: 'exec Addons.ExecuteAddon {"addonid":"script.test"}',
          regex: /^(exec)\s+([\w\.]+)\s+(\S+)$/i
        };

        expect($$.testing.getMessageToken(command, 1)).toBe('exec');
        expect($$.testing.getMessageToken(command, 2)).toBe('Addons.ExecuteAddon');
        expect($$.testing.getMessageToken(command, 3)).toBe('{"addonid":"script.test"}');
      });

    });

    describe('.makeMessageParams()', function makeMessageParams_0() {

      it('should make single message parameters object for Framework7.messages.addMessage() method', function makeMessageParams_1() {
        var params;

        $$.lastMessageTime = 0;
        params = $$.testing.makeMessageParams('Message <text>', 'sent');
        expect(params.text).toBe('Message &lt;text&gt;');
        expect(params.type).toBe('sent');
        expect(params.day).toMatch(/^[0-9A-Z, ]+$/i);
        expect(params.time).toMatch(/^[0-9:]+$/i);
        expect(params.avatar).toBe($$.avaSent);

        params = $$.testing.makeMessageParams('Message <text>', 'received');
        expect(params.avatar).toBe($$.avaRecv);
        expect(params.day).toBeUndefined();
        expect(params.time).toBeUndefined();
      });

    });

    describe('.checkMessage()', function checkMessage_0() {

      it('should return rejected promise if message string is empty', function checkMessage_1(done) {
        $$.testing.checkMessage('').then(null, function (v) {
          expect(v).toBeUndefined();
          done();
        });
      });

      it('should return resolved promise with the command object and command.message set to message string', function checkMessage_2(done) {
        $$.testing.checkMessage('Help').then(function (v) {
          expect(v).toEqual({
            message: 'Help'
          });
          done();
        });
      });

      it('should set command.silent to true if message string starts with "."', function checkMessage_3(done) {
        $$.testing.checkMessage('.Help').then(function (v) {
          expect(v).toEqual({
            message: 'Help',
            silent: true
          });
          done();
        });
      });

    });

    describe('.addQuestionMessage()', function addQuestionMessage_0() {
      var command;

      beforeEach(function () {
        command = {
          message: 'Help'
        };
        spyOn($$.messages, 'addMessage');
      });

      it('should call kTalk.messages.addMessage method', function addQuestionMessage_1() {
        expect($$.testing.addQuestionMessage(command)).toBe(command);
        expect($$.messages.addMessage).toHaveBeenCalled();
      });

      it('should not call kTalk.messages.addMessage method if command.silent is true', function addQuestionMessage_1() {
        command.silent = true;
        expect($$.testing.addQuestionMessage(command)).toBe(command);
        expect($$.messages.addMessage).not.toHaveBeenCalled();
      });

    });

    describe('.parseProperty()', function parseProperty_0() {
      var command, result;

      beforeEach(function () {
        result = {
          playerid: 2,
          properties: ['artist', 'album'],
          message: 'Hello, Kodi from test 123.'
        };
        command = {
          message: result.message,
          regex: /^(hello)[\.,!\?]*\s+([A-Z]+)\s+from\s+test\s+(\d+)[\.,!\?]*$/i,
          params_s: JSON.stringify(result),
          params_o: result,
          params_b: true,
          params_n: 123,
          params_fs: function (c) {
            return JSON.stringify(result);
          },
          params_fo: function (c) {
            return result;
          },
          params_ts: '{"command":"$1","properties":["$2",$3]}',
          params_to: {
            command: '$1',
            properties: ['$2', '$3']
          }
        };
      });

      it('should return undefined if the property doesn\'t exists', function parseProperty_1() {
        expect($$.testing.parseProperty(command, 'foo')).toBeUndefined();
        expect($$.testing.parseProperty(command, 'bar', true)).toBeUndefined();
      });

      it('should return result of property(command) if the property is a function', function parseProperty_2() {
        expect($$.testing.parseProperty(command, 'params_fs')).toEqual(JSON.stringify(result));
        expect($$.testing.parseProperty(command, 'params_fs', true)).toEqual(result);
        expect($$.testing.parseProperty(command, 'params_fo')).toEqual(result);
        expect($$.testing.parseProperty(command, 'params_fo', 1)).toEqual(result);
      });

      it('should return a string if toJson set to false', function parseProperty_3() {
        result = JSON.stringify(result);
        expect($$.testing.parseProperty(command, 'params_s')).toEqual(result);
        expect($$.testing.parseProperty(command, 'params_o')).toEqual(result);
        expect($$.testing.parseProperty(command, 'params_s', false)).toEqual(result);
        expect($$.testing.parseProperty(command, 'params_o', 0)).toEqual(result);
        expect($$.testing.parseProperty(command, 'params_b')).toEqual('true');
        expect($$.testing.parseProperty(command, 'params_n')).toEqual('123');
        expect($$.testing.parseProperty(command, 'params_b', false)).toEqual('true');
        expect($$.testing.parseProperty(command, 'params_n', 0)).toEqual('123');
      });

      it('should return an object if toJson set to true', function parseProperty_4() {
        expect($$.testing.parseProperty(command, 'params_s', true)).toEqual(result);
        expect($$.testing.parseProperty(command, 'params_o', 1)).toEqual(result);
        expect($$.testing.parseProperty(command, 'params_b', true)).toEqual(true);
        expect($$.testing.parseProperty(command, 'params_n', 1)).toEqual(123);
      });

      it('should substitute $# with the tokens from command.message', function parseProperty_5() {
        var result_a = {
            command: 'Hello',
            properties: ['Kodi', 123]
          },
          result_b = {
            command: 'Hello',
            properties: ['Kodi', '123']
          };

        expect($$.testing.parseProperty(command, 'params_ts')).toEqual(JSON.stringify(result_a));
        expect($$.testing.parseProperty(command, 'params_to')).toEqual(JSON.stringify(result_b));
        expect($$.testing.parseProperty(command, 'params_ts', true)).toEqual(result_a);
        expect($$.testing.parseProperty(command, 'params_to', true)).toEqual(result_b);
      });

    });

    describe('.parseKodiCommand()', function parseKodiCommand_0() {
      var command, result;

      beforeEach(function () {
        command = {
          message: ''
        };
      });

      it('should successfully parse "hello" command', function parseKodiCommand_1() {
        result = getCommand('hello');

        command.message = 'hello';
        result.message = command.message;
        expect($$.testing.parseKodiCommand(command)).toEqual(jasmine.objectContaining(result));

        command.message = 'hello!';
        result.message = command.message;
        expect($$.testing.parseKodiCommand(command)).toEqual(jasmine.objectContaining(result));

        command.message = 'Hello ?';
        result.message = command.message;
        expect($$.testing.parseKodiCommand(command)).toEqual(jasmine.objectContaining(result));
      });

      it('should successfully parse "help" command', function parseKodiCommand_2() {
        result = getCommand('help');

        command.message = 'help';
        result.message = command.message;
        expect($$.testing.parseKodiCommand(command)).toEqual(jasmine.objectContaining(result));

        command.message = 'Help.';
        result.message = command.message;
        expect($$.testing.parseKodiCommand(command)).toEqual(jasmine.objectContaining(result));

        command.message = 'Help !';
        result.message = command.message;
        expect($$.testing.parseKodiCommand(command)).toEqual(jasmine.objectContaining(result));
      });

      it('should successfully parse "debug" command', function parseKodiCommand_2() {
        result = getCommand('debug');

        command.message = 'debug true';
        result.message = command.message;
        expect($$.testing.parseKodiCommand(command)).toEqual(jasmine.objectContaining(result));

        command.message = 'Debug  window';
        result.message = command.message;
        expect($$.testing.parseKodiCommand(command)).toEqual(jasmine.objectContaining(result));

        command.message = 'DEBUG window.kTalk';
        result.message = command.message;
        expect($$.testing.parseKodiCommand(command)).toEqual(jasmine.objectContaining(result));
      });

      it('should return rejected promise for unknown command', function parseKodiCommand_5(done) {
        command.message = 'Fake message.';
        $$.testing.parseKodiCommand(command).then(null, function (v) {
          expect(v).toBe('Sorry, I can\'t understand you. I will learn more commands soon.');
          done();
        });
      });

    });

    describe('.callJsonRpcMethod()', function callJsonRpcMethod_0() {
      var command, xhrMethod, headers, data, response, result, xhr;

      beforeEach(function () {
        xhrMethod = 'POST';
        headers = {
          'Content-Type': 'application/json'
        };
        data = {
          id: $$.commandId + 1,
          jsonrpc: "2.0"
        };
        response = {
          status: 200,
          contentType: headers['Content-Type'],
          responseText: {
            id: $$.commandId + 1,
            jsonrpc: '2.0'
          }
        };
        jasmine.Ajax.install();
      });

      afterEach(function () {
        jasmine.Ajax.uninstall();
      });

      it('should call JSONRPC.Ping method via XMLHttpRequest and return resolved promise with result in the command.response', function callJsonRpcMethod_1(done) {
        command = getCommand('ping');
        data.method = command.method;
        data.params = {};
        result = clone(command, ['name', 'description', 'regex', 'method']);
        result.response = 'pong';
        response.responseText.result = result.response;
        response.responseText = JSON.stringify(response.responseText);

        $$.testing.callJsonRpcMethod(command).then(function (v) {
          expect(v).toEqual(jasmine.objectContaining(result));
          done();
        });
        xhr = jasmine.Ajax.requests.mostRecent();
        expect(xhr.method).toBe(xhrMethod);
        expect(xhr.url).toBe($$.jsonRpcUrl);
        expect(xhr.requestHeaders).toEqual(jasmine.objectContaining(headers));
        expect(xhr.data()).toEqual(jasmine.objectContaining(data));
        xhr.respondWith(response);
      });

      it('should call Player.Open method via XMLHttpRequest and return resolved promise with result in the command.response', function callJsonRpcMethod_2(done) {
        command = getCommand('exec');
        command.method = 'Player.Open';
        command.params = {
          item: {
            file: 'plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=YE7VzlLtp-4'
          }
        };
        data.method = command.method;
        data.params = command.params;
        result = clone(command, ['name', 'description', 'regex', 'method', 'params']);
        result.response = 'OK';
        response.responseText.result = result.response;
        response.responseText = JSON.stringify(response.responseText);

        $$.testing.callJsonRpcMethod(command).then(function (v) {
          expect(v).toEqual(jasmine.objectContaining(result));
          done();
        });
        xhr = jasmine.Ajax.requests.mostRecent();
        expect(xhr.method).toBe(xhrMethod);
        expect(xhr.url).toBe($$.jsonRpcUrl);
        expect(xhr.requestHeaders).toEqual(jasmine.objectContaining(headers));
        expect(xhr.data()).toEqual(jasmine.objectContaining(data));
        xhr.respondWith(response);
      });

      it('should call JSONRPC.Fake method via XMLHttpRequest and return rejected promise with error description', function callJsonRpcMethod_3(done) {
        command = getCommand('exec');
        command.method = 'JSONRPC.Fake';
        command.params = {
          foo: {
            bar: '!@#$%^&*()_+-={}[]:";\'<>?,./`~ \n'
          }
        };
        data.method = command.method;
        data.params = command.params;
        result = {
          code: -32601,
          message: 'Method not found.'
        };
        response.responseText.error = result;
        response.responseText = JSON.stringify(response.responseText);

        $$.testing.callJsonRpcMethod(command).then(null, function (v) {
          expect(v).toEqual(jasmine.objectContaining(result));
          done();
        });
        xhr = jasmine.Ajax.requests.mostRecent();
        expect(xhr.method).toBe(xhrMethod);
        expect(xhr.url).toBe($$.jsonRpcUrl);
        expect(xhr.requestHeaders).toEqual(jasmine.objectContaining(headers));
        expect(xhr.data()).toEqual(jasmine.objectContaining(data));
        xhr.respondWith(response);
      });

      it('should call JSONRPC.Ping method via XMLHttpRequest and return rejected promise if server responds with 404 HTTP status', function callJsonRpcMethod_4(done) {
        command = getCommand('ping');
        data.method = command.method;
        data.params = {};
        response.status = 404;
        response.contentType = 'text/html';
        response.responseText = '<html><head><title>File not found</title></head><body>File not found</body></html>'
        result = {
          code: response.status.toString(),
          message: 'Failed to complete JSON-RPC request to the Kodi server.'
        };

        $$.testing.callJsonRpcMethod(command).then(null, function (v) {
          expect(v).toEqual(jasmine.objectContaining(result));
          done();
        });
        xhr = jasmine.Ajax.requests.mostRecent();
        expect(xhr.method).toBe(xhrMethod);
        expect(xhr.url).toBe($$.jsonRpcUrl);
        expect(xhr.requestHeaders).toEqual(jasmine.objectContaining(headers));
        expect(xhr.data()).toEqual(jasmine.objectContaining(data));
        xhr.respondWith(response);
      });

      it('should\'t send XMLHttpRequest if command has no "method" property and just return command object', function callJsonRpcMethod_5() {
        command = getCommand('hello');
        expect($$.testing.callJsonRpcMethod(command)).toBe(command);
      });

    });

    xdescribe('.formatAnswerMessage()', function formatAnswerMessage_0() {

      it('should ...', function formatAnswerMessage_1() {
        expect($$.testing.formatAnswerMessage('')).toBe('');
      });

      it('should ...', function formatAnswerMessage_2() {
        expect($$.testing.formatAnswerMessage('')).toBe('');
      });

    });

    xdescribe('.formatErrorMessage()', function formatErrorMessage_0() {

      it('should ...', function formatErrorMessage_1() {
        expect($$.testing.formatErrorMessage('')).toBe('');
      });

      it('should ...', function formatErrorMessage_2() {
        expect($$.testing.formatErrorMessage('')).toBe('');
      });

    });

    xdescribe('.addReceivedMessage()', function addReceivedMessage_0() {

      it('should ...', function addReceivedMessage_1() {
        expect($$.testing.addReceivedMessage('')).toBe('');
      });

      it('should ...', function addReceivedMessage_2() {
        expect($$.testing.addReceivedMessage('')).toBe('');
      });

    });

    xdescribe('.addAnswerMessage()', function addAnswerMessage_0() {

      it('should ...', function addAnswerMessage_1() {
        expect($$.testing.addAnswerMessage('')).toBe('');
      });

      it('should ...', function addAnswerMessage_2() {
        expect($$.testing.addAnswerMessage('')).toBe('');
      });

    });

    xdescribe('.addErrorMessage()', function addErrorMessage_0() {

      it('should ...', function addErrorMessage_1() {
        expect($$.testing.addErrorMessage('')).toBe('');
      });

      it('should ...', function addErrorMessage_2() {
        expect($$.testing.addErrorMessage('')).toBe('');
      });

    });

    xdescribe('.sendCommand()', function sendCommand_0() {

      it('should ...', function sendCommand_1() {
        expect($$.testing.sendCommand('')).toBe('');
      });

      it('should ...', function sendCommand_2() {
        expect($$.testing.sendCommand('')).toBe('');
      });

    });

    xdescribe('.sendQueuedCommand()', function sendQueuedCommand_0() {

      it('should ...', function sendQueuedCommand_1() {
        expect($$.testing.sendQueuedCommand('')).toBe('');
      });

      it('should ...', function sendQueuedCommand_2() {
        expect($$.testing.sendQueuedCommand('')).toBe('');
      });

    });

    xdescribe('.talkToKodi()', function talkToKodi_0() {

      it('should ...', function talkToKodi_1() {
        expect($$.testing.talkToKodi('')).toBe('');
      });

      it('should ...', function talkToKodi_2() {
        expect($$.testing.talkToKodi('')).toBe('');
      });

    });

    xdescribe('.addInfoMessages()', function addInfoMessages_0() {

      it('should ...', function addInfoMessages_1() {
        expect($$.testing.addInfoMessages('')).toBe('');
      });

      it('should ...', function addInfoMessages_2() {
        expect($$.testing.addInfoMessages('')).toBe('');
      });

    });

    xdescribe('.sendMessage()', function sendMessage_0() {

      it('should ...', function sendMessage_1() {
        expect($$.testing.sendMessage('')).toBe('');
      });

      it('should ...', function sendMessage_2() {
        expect($$.testing.sendMessage('')).toBe('');
      });

    });

    xdescribe('.addGreetings()', function addGreetings_0() {

      it('should ...', function addGreetings_1() {
        expect($$.testing.addGreetings('')).toBe('');
      });

      it('should ...', function addGreetings_2() {
        expect($$.testing.addGreetings('')).toBe('');
      });

    });

    xdescribe('.method()', function method_0() {

      it('should ...', function method_1() {
        expect($$.testing.method('')).toBe('');
      });

      it('should ...', function method_2() {
        expect($$.testing.method('')).toBe('');
      });

    });

  });

});
