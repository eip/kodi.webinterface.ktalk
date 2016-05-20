/*global jasmine, expect, describe, xdescribe, it, beforeEach, afterEach*/
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

  describe('Initialization', function initialization_0() {

    it('kTalk should be an object', function initialization_1() {
      expect($$).toEqual(jasmine.any(Object));
    });

    it('kTalk.lib should be an object', function initialization_2() {
      expect($$.lib).toEqual(jasmine.any(Object));
    });

    it('kTalk.f7 should be a Framework7 object', function initialization_3() {
      expect($$.f7).toEqual(jasmine.any(Framework7));
    });

    it('kTalk.d7 should be a function', function initialization_4() {
      expect($$.d7).toEqual(jasmine.any(Function));
    });

    it('kTalk.d7 should be a function', function initialization_5() {
      expect($$.d7).toEqual(jasmine.any(Function));
    });

    it('kTalk.messages should be initialized', function initialization_6() {
      expect($$.messages).toEqual(jasmine.any(Object));
      expect($$.messages.container[0]).toEqual(jasmine.any(window.HTMLDivElement));
      expect($$.messages.container[0].nodeType).toBe(1);
      expect($$.messages.params.autoLayout).toBe(true);
      expect($$.messages.params.messageTemplate).toEqual(jasmine.any(String));
      expect($$.messages.params.newMessagesFirst).toBe(false);
    });

    it('kTalk.messagebar should be initialized', function initialization_7() {
      expect($$.messagebar).toEqual(jasmine.any(Object));
      expect($$.messagebar.container[0]).toEqual(jasmine.any(window.HTMLDivElement));
      expect($$.messagebar.container[0].nodeType).toBe(1);
      expect($$.messagebar.textarea[0]).toEqual(jasmine.any(window.HTMLTextAreaElement));
      expect($$.messagebar.textarea[0].nodeType).toBe(1);
    });

    it('kTalk\'s members of primitive data types shold be initialized', function initialization_8() {
      expect($$.jsonRpcUrl).toEqual(jasmine.any(String));
      expect($$.avaRecv).toEqual(jasmine.any(String));
      expect($$.avaSent).toEqual(jasmine.any(String));
      expect($$.busy).toBe(false);
      expect($$.commandId).toBe(0);
      expect($$.lastMessageTime).toBe(0);
    });

    it('kTalk.commands should be initialized', function initialization_9() {
      expect($$.commands).toEqual(jasmine.any(Array));
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

    it('kTalk.queue should be initialized', function initialization_a() {
      expect($$.queue).toEqual(jasmine.any(Object));
      expect($$.queue.commands).toEqual(jasmine.any(Array));
      expect($$.queue.answers).toEqual(jasmine.any(Array));
    });

  });

  describe('.lib', function lib_0() {

    describe('.q()', function q_0() {

      it('should return resolved promise with the given value', function q_1(done) {
        $$.lib.q('Resolved').then(function (v) {
          expect(v).toBe('Resolved');
          done();
        });
      });

    });

    describe('.qt()', function qt_0() {

      it('should return resolved promise with the given value', function qt_1(done) {
        $$.lib.qt('Resolved', 1).then(function (v) {
          expect(v).toBe('Resolved');
          done();
        });
      });

      it("promise should be resolved after 50 ms", function qt_2(done) {
        var delay = 50,
          startTime = Date.now();
        $$.lib.qt('Resolved', delay).then(function (v) {
          expect(Date.now() - startTime).toBeCloseTo(delay, -2);
          done();
        });
      });

      it("promise should be resolved after 500 ms (default)", function qt_3(done) {
        var delay = 500,
          startTime = Date.now();
        $$.lib.qt('Resolved').then(function (v) {
          expect(Date.now() - startTime).toBeCloseTo(delay, -2);
          done();
        });
      });

    });

    describe('.r()', function r_0() {

      it('should return rejected promise with the given value', function r_1(done) {
        $$.lib.r('Rejected').then(null, function (v) {
          expect(v).toBe('Rejected');
          done();
        });
      });

    });

    describe('.capitalize()', function capitalize_0() {

      it('should return string with the 1st letter in upper case', function capitalize_1() {
        expect($$.lib.capitalize('S')).toBe('S');
        expect($$.lib.capitalize('s')).toBe('S');
        expect($$.lib.capitalize('string')).toBe('String');
      });

      it('should return rest of the string in lower case', function capitalize_2() {
        expect($$.lib.capitalize('STRING')).toBe('String');
        expect($$.lib.capitalize('sTrInG')).toBe('String');
      });

    });

    describe('.formatDay()', function formatDay_0() {

      it('should format date as "Day, Mon #"', function formatDay_1() {
        expect($$.lib.formatDay(new Date(2001, 0, 1))).toBe('Monday, Jan 1');
        expect($$.lib.formatDay(new Date(2001, 1, 6))).toBe('Tuesday, Feb 6');
        expect($$.lib.formatDay(new Date(2001, 2, 7))).toBe('Wednesday, Mar 7');
        expect($$.lib.formatDay(new Date(2001, 3, 5))).toBe('Thursday, Apr 5');
        expect($$.lib.formatDay(new Date(2001, 4, 4))).toBe('Friday, May 4');
        expect($$.lib.formatDay(new Date(2001, 5, 2))).toBe('Saturday, Jun 2');
        expect($$.lib.formatDay(new Date(2001, 6, 1))).toBe('Sunday, Jul 1');
        expect($$.lib.formatDay(new Date(2001, 7, 18))).toBe('Saturday, Aug 18');
        expect($$.lib.formatDay(new Date(2001, 8, 21))).toBe('Friday, Sep 21');
        expect($$.lib.formatDay(new Date(2001, 9, 25))).toBe('Thursday, Oct 25');
        expect($$.lib.formatDay(new Date(2001, 10, 28))).toBe('Wednesday, Nov 28');
        expect($$.lib.formatDay(new Date(2001, 11, 11))).toBe('Tuesday, Dec 11');
      });

    });

    describe('.formatTime()', function formatTime_0() {

      it('should format time as "##:##"', function formatTime_1() {
        expect($$.lib.formatTime(new Date(2001, 0, 1))).toBe('00:00');
        expect($$.lib.formatTime(new Date(2001, 0, 1, 1, 1, 1))).toBe('01:01');
        expect($$.lib.formatTime(new Date(2001, 0, 1, 12, 30, 0))).toBe('12:30');
        expect($$.lib.formatTime(new Date(2001, 0, 1, 23, 59, 59))).toBe('23:59');
      });

    });

    describe('.formatDate()', function formatDate_0() {

      it('should format date-time as ""Day, Mon # <span>##:##</span>"', function formatDate_1() {
        expect($$.lib.formatDate(new Date(2001, 0, 1))).toBe('Monday, Jan 1, <span>00:00</span>');
        expect($$.lib.formatDate(new Date(2001, 0, 1, 1, 1, 1))).toBe('Monday, Jan 1, <span>01:01</span>');
        expect($$.lib.formatDate(new Date(2001, 0, 1, 12, 30, 0))).toBe('Monday, Jan 1, <span>12:30</span>');
        expect($$.lib.formatDate(new Date(2001, 0, 1, 23, 59, 59))).toBe('Monday, Jan 1, <span>23:59</span>');
      });

    });

    describe('.formatJson()', function formatJson_0() {

      it('should simplify JSON format', function formatJson_1() {
        expect($$.lib.formatJson(true)).toBe('true');
        expect($$.lib.formatJson(0)).toBe('0');
        expect($$.lib.formatJson('A string')).toBe('A string');
        expect($$.lib.formatJson('Multiline string\nSecond line')).toBe('Multiline string\\nSecond line');
        expect($$.lib.formatJson({
          a: true,
          b: 0,
          c: 'A string',
          d: {
            da: 'One',
            db: 'Two'
          }
        })).toBe('    a: true\n    b: 0\n    c: A string\n    d:\n        da: One\n        db: Two');
        expect($$.lib.formatJson(['One', 'Two', 'Three', 'Four'])).toBe('(\n    One\n    Two\n    Three\n    Four\n)');
        expect($$.lib.formatJson({
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
        expect($$.lib.encodeHtmlEntities('&')).toBe('&amp;');
        expect($$.lib.encodeHtmlEntities('<')).toBe('&lt;');
        expect($$.lib.encodeHtmlEntities('>')).toBe('&gt;');
        expect($$.lib.encodeHtmlEntities('!@#$%^&*()_+-={}[]:";\'<>?,./`~ \n\u0000\r\u0127')).toBe('!@#$%^&amp;*()_+-={}[]:&#34;;\'&lt;&gt;?,./`~ &#10;&#0;&#13;&#295;');
      });

    });

    describe('.transformPlayerUri()', function transformPlayerUri_0() {

      it('should transform Youtube URLs', function transformPlayerUri_1() {
        expect($$.lib.transformPlayerUri('http://www.youtube.com/?feature=player_embedded&v=dQw4w9WgXcQ')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=dQw4w9WgXcQ');
        expect($$.lib.transformPlayerUri('http://www.youtube.com/?v=dQw4w9WgXcQ')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=dQw4w9WgXcQ');
        expect($$.lib.transformPlayerUri('http://www.youtube.com/e/dQw4w9WgXcQ')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=dQw4w9WgXcQ');
        expect($$.lib.transformPlayerUri('http://www.youtube.com/embed/0zM3nApSvMg?rel=0"')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=0zM3nApSvMg');
        expect($$.lib.transformPlayerUri('http://www.youtube.com/embed/0zM3nApSvMg?rel=0')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=0zM3nApSvMg');
        expect($$.lib.transformPlayerUri('http://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=dQw4w9WgXcQ');
        expect($$.lib.transformPlayerUri('http://www.youtube.com/embed/nas1rJpm7wY?rel=0')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=nas1rJpm7wY');
        expect($$.lib.transformPlayerUri('http://www.youtube.com/embed/NLqTHREEVbY')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=NLqTHREEVbY');
        expect($$.lib.transformPlayerUri('http://www.youtube.com/user/IngridMichaelsonVEVO#p/a/u/1/KdwsulMb8EQ')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=KdwsulMb8EQ');
        expect($$.lib.transformPlayerUri('http://www.youtube.com/user/IngridMichaelsonVEVO#p/a/u/1/QdK8U-VIH_o')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=QdK8U-VIH_o');
        expect($$.lib.transformPlayerUri('http://www.youtube.com/user/IngridMichaelsonVEVO#p/u/11/KdwsulMb8EQ')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=KdwsulMb8EQ');
        expect($$.lib.transformPlayerUri('http://www.youtube.com/user/Scobleizer#p/u/1/1p3NINEsYGo')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=1p3NINEsYGo');
        expect($$.lib.transformPlayerUri('http://www.youtube.com/user/Scobleizer#p/u/1/1p3vcRhsYGo')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=1p3vcRhsYGo');
        expect($$.lib.transformPlayerUri('http://www.youtube.com/user/Scobleizer#p/u/1/1p3vcRhsYGo?rel=0')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=1p3vcRhsYGo');
        expect($$.lib.transformPlayerUri('http://www.youtube.com/user/Scobleizer#p/u/1/1p3vONEsYGo')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=1p3vONEsYGo');
        expect($$.lib.transformPlayerUri('http://www.youtube.com/user/Scobleizer#p/u/1/1pSEVENsYGo')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=1pSEVENsYGo');
        expect($$.lib.transformPlayerUri('http://www.youtube.com/user/SilkRoadTheatre#p/a/u/2/6dwqZw0j_jY')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=6dwqZw0j_jY');
        expect($$.lib.transformPlayerUri('http://www.youtube.com/v/0zM3nApSvMg?fs=1&amp;hl=en_US&amp;rel=0')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=0zM3nApSvMg');
        expect($$.lib.transformPlayerUri('http://www.youtube.com/v/0zM3nApSvMg?fs=1&hl=en_US&rel=0')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=0zM3nApSvMg');
        expect($$.lib.transformPlayerUri('http://www.youtube.com/v/dQw4w9WgXcQ')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=dQw4w9WgXcQ');
        expect($$.lib.transformPlayerUri('http://www.youtube.com/v/NLqAFFIVEbY?fs=1&hl=en_US')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=NLqAFFIVEbY');
        expect($$.lib.transformPlayerUri('http://www.youtube.com/watch?feature=feedrec_grec_index&v=0zM3nApSvMg')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=0zM3nApSvMg');
        expect($$.lib.transformPlayerUri('http://www.youtube.com/watch?feature=player_detailpage&v=8UVNT4wvIGY')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=8UVNT4wvIGY');
        expect($$.lib.transformPlayerUri('http://www.youtube.com/watch?feature=player_embedded&v=dQw4w9WgXcQ')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=dQw4w9WgXcQ');
        expect($$.lib.transformPlayerUri('http://www.youtube.com/watch?v=0zM3nApSvMg#t=0m10s')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=0zM3nApSvMg');
        expect($$.lib.transformPlayerUri('http://www.youtube.com/watch?v=0zM3nApSvMg&feature=feedrec_grec_index')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=0zM3nApSvMg');
        expect($$.lib.transformPlayerUri('http://www.youtube.com/watch?v=0zM3nApSvMg')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=0zM3nApSvMg');
        expect($$.lib.transformPlayerUri('http://www.youtube.com/watch?v=0zM3nApSvMg/')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=0zM3nApSvMg');
        expect($$.lib.transformPlayerUri('http://www.youtube.com/watch?v=6dwqZw0j_jY&feature=youtu.be')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=6dwqZw0j_jY');
        expect($$.lib.transformPlayerUri('http://www.youtube.com/watch?v=cKZDdG9FTKY&feature=channel')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=cKZDdG9FTKY');
        expect($$.lib.transformPlayerUri('http://www.youtube.com/watch?v=dQw4w9WgXcQ&feature=youtube_gdata_player')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=dQw4w9WgXcQ');
        expect($$.lib.transformPlayerUri('http://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=dQw4w9WgXcQ');
        expect($$.lib.transformPlayerUri('http://www.youtube.com/watch?v=JYATEN_TzhA&feature=featured')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=JYATEN_TzhA');
        expect($$.lib.transformPlayerUri('http://www.youtube.com/watch?v=NLqASIXrVbY')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=NLqASIXrVbY');
        expect($$.lib.transformPlayerUri('http://www.youtube.com/watch?v=peFZbP64dsU')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=peFZbP64dsU');
        expect($$.lib.transformPlayerUri('http://www.youtube.com/watch?v=yZ-K7nCVnBI&playnext_from=TL&videos=osPknwzXEas&feature=sub')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=yZ-K7nCVnBI');
        expect($$.lib.transformPlayerUri('http://www.youtube.com/ytscreeningroom?v=NRHEIGHTx8I')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=NRHEIGHTx8I');
        expect($$.lib.transformPlayerUri('http://www.youtube.com/ytscreeningroom?v=NRHVzbJVx8I')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=NRHVzbJVx8I');
        expect($$.lib.transformPlayerUri('http://youtu.be/0zM3nApSvMg')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=0zM3nApSvMg');
        expect($$.lib.transformPlayerUri('http://youtu.be/6dwqZw0j_jY')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=6dwqZw0j_jY');
        expect($$.lib.transformPlayerUri('http://youtu.be/afa-5HQHiAs')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=afa-5HQHiAs');
        expect($$.lib.transformPlayerUri('http://youtu.be/dQw4w9WgXcQ')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=dQw4w9WgXcQ');
        expect($$.lib.transformPlayerUri('http://youtu.be/dQw4w9WgXcQ?feature=youtube_gdata_player')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=dQw4w9WgXcQ');
        expect($$.lib.transformPlayerUri('http://youtu.be/NLqAFTWOVbY')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=NLqAFTWOVbY');
        expect($$.lib.transformPlayerUri('http://youtu.be/vfGY-laqamA')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=vfGY-laqamA');
        expect($$.lib.transformPlayerUri('http://youtube.com/?v=dQw4w9WgXcQ&feature=youtube_gdata_player')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=dQw4w9WgXcQ');
        expect($$.lib.transformPlayerUri('http://youtube.com/?vi=dQw4w9WgXcQ&feature=youtube_gdata_player')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=dQw4w9WgXcQ');
        expect($$.lib.transformPlayerUri('http://youtube.com/v/dQw4w9WgXcQ?feature=youtube_gdata_player')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=dQw4w9WgXcQ');
        expect($$.lib.transformPlayerUri('http://youtube.com/vi/dQw4w9WgXcQ?feature=youtube_gdata_player')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=dQw4w9WgXcQ');
        expect($$.lib.transformPlayerUri('http://youtube.com/watch?v=dQw4w9WgXcQ&feature=youtube_gdata_player')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=dQw4w9WgXcQ');
        expect($$.lib.transformPlayerUri('http://youtube.com/watch?vi=dQw4w9WgXcQ&feature=youtube_gdata_player')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=dQw4w9WgXcQ');
        expect($$.lib.transformPlayerUri('https://www.youtube.com/watch?v=S09F5MejfBE')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=S09F5MejfBE');
      });

    });

  });

  describe('.getMessageToken()', function getMessageToken_0() {

    it('should return the token by number from the command message', function getMessageToken_1() {
      var command = {
        message: 'exec Addons.ExecuteAddon {"addonid":"script.test"}',
        regex: /^(exec)\s+([\w\.]+)\s+(\S+)$/i
      };

      expect($$.getMessageToken(command, 1)).toBe('exec');
      expect($$.getMessageToken(command, 2)).toBe('Addons.ExecuteAddon');
      expect($$.getMessageToken(command, 3)).toBe('{"addonid":"script.test"}');
    });

  });

  describe('.makeMessageParams()', function makeMessageParams_0() {

    it('should make single message parameters object for Framework7.messages.addMessage() method', function makeMessageParams_1() {
      var params;

      $$.lastMessageTime = 0;
      params = $$.makeMessageParams('Message <text>', 'sent');
      expect(params.text).toBe('Message &lt;text&gt;');
      expect(params.type).toBe('sent');
      expect(params.day).toMatch(/^[0-9A-Z, ]+$/i);
      expect(params.time).toMatch(/^[0-9:]+$/i);
      expect(params.avatar).toBe($$.avaSent);

      params = $$.makeMessageParams('Message <text>', 'received');
      expect(params.avatar).toBe($$.avaRecv);
      expect(params.day).toBeUndefined();
      expect(params.time).toBeUndefined();
    });

  });

});
