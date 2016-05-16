/*global jasmine, expect, describe, xdescribe, it, beforeEach, afterEach*/
/*global Framework7*/
/*jshint -W053*/

describe('kTalk', function kTalk_0() {
  'use strict';

  function getCommand(name) {
    return window.kTalk.commands.find(function (c) {
      return c.name === name;
    });
  }

  describe('Initialization', function initialization_0() {

    it('window.kTalk should be an object', function initialization_1() {
      expect(typeof window.kTalk).toBe('object');
    });

    it('window.kTalk.lib should be an object', function initialization_2() {
      expect(typeof window.kTalk.lib).toBe('object');
    });

    it('window.kTalk.f7 should be an Framework7 object', function initialization_3() {
      expect(window.kTalk.f7 instanceof Framework7).toBe(true);
    });

    it('window.kTalk.d7 should be a function', function initialization_3() {
      expect(typeof window.kTalk.d7).toBe('function');
    });

  });

  describe('.lib', function lib_0() {

    describe('.q()', function q_0() {

      it('should return resolved promise with the given value', function q_1(done) {
        window.kTalk.lib.q('Resolved').then(function (v) {
          expect(v).toBe('Resolved');
          done();
        });
      });

    });

    describe('.qt()', function qt_0() {

      it('should return resolved promise with the given value', function qt_1(done) {
        window.kTalk.lib.qt('Resolved', 1).then(function (v) {
          expect(v).toBe('Resolved');
          done();
        });
      });

      it("promise should be resolved after 50 ms", function qt_2(done) {
        var delay = 50,
          startTime = Date.now();
        window.kTalk.lib.qt('Resolved', delay).then(function (v) {
          expect(Date.now() - startTime).toBeCloseTo(delay, -2);
          done();
        });
      });

      it("promise should be resolved after 500 ms (default)", function qt_3(done) {
        var delay = 500,
          startTime = Date.now();
        window.kTalk.lib.qt('Resolved').then(function (v) {
          expect(Date.now() - startTime).toBeCloseTo(delay, -2);
          done();
        });
      });

    });

    describe('.r()', function r_0() {

      it('should return rejected promise with the given value', function r_1(done) {
        window.kTalk.lib.r('Rejected').then(null, function (v) {
          expect(v).toBe('Rejected');
          done();
        });
      });

    });

    describe('.capitalize()', function capitalize_0() {

      it('should return string with the 1st letter in upper case', function capitalize_1() {
        expect(window.kTalk.lib.capitalize('S')).toBe('S');
        expect(window.kTalk.lib.capitalize('s')).toBe('S');
        expect(window.kTalk.lib.capitalize('string')).toBe('String');
      });

      it('should return rest of the string in lower case', function capitalize_2() {
        expect(window.kTalk.lib.capitalize('STRING')).toBe('String');
        expect(window.kTalk.lib.capitalize('sTrInG')).toBe('String');
      });

    });

    describe('.formatDay()', function formatDay_0() {

      it('should format date as "Day, Mon #"', function formatDay_1() {
        expect(window.kTalk.lib.formatDay(new Date(2001, 0, 1))).toBe('Monday, Jan 1');
        expect(window.kTalk.lib.formatDay(new Date(2001, 1, 6))).toBe('Tuesday, Feb 6');
        expect(window.kTalk.lib.formatDay(new Date(2001, 2, 7))).toBe('Wednesday, Mar 7');
        expect(window.kTalk.lib.formatDay(new Date(2001, 3, 5))).toBe('Thursday, Apr 5');
        expect(window.kTalk.lib.formatDay(new Date(2001, 4, 4))).toBe('Friday, May 4');
        expect(window.kTalk.lib.formatDay(new Date(2001, 5, 2))).toBe('Saturday, Jun 2');
        expect(window.kTalk.lib.formatDay(new Date(2001, 6, 1))).toBe('Sunday, Jul 1');
        expect(window.kTalk.lib.formatDay(new Date(2001, 7, 18))).toBe('Saturday, Aug 18');
        expect(window.kTalk.lib.formatDay(new Date(2001, 8, 21))).toBe('Friday, Sep 21');
        expect(window.kTalk.lib.formatDay(new Date(2001, 9, 25))).toBe('Thursday, Oct 25');
        expect(window.kTalk.lib.formatDay(new Date(2001, 10, 28))).toBe('Wednesday, Nov 28');
        expect(window.kTalk.lib.formatDay(new Date(2001, 11, 11))).toBe('Tuesday, Dec 11');
      });

    });

    describe('.formatTime()', function formatTime_0() {

      it('should format time as "##:##"', function formatTime_1() {
        expect(window.kTalk.lib.formatTime(new Date(2001, 0, 1))).toBe('00:00');
        expect(window.kTalk.lib.formatTime(new Date(2001, 0, 1, 1, 1, 1))).toBe('01:01');
        expect(window.kTalk.lib.formatTime(new Date(2001, 0, 1, 12, 30, 0))).toBe('12:30');
        expect(window.kTalk.lib.formatTime(new Date(2001, 0, 1, 23, 59, 59))).toBe('23:59');
      });

    });

    describe('.formatDate()', function formatDate_0() {

      it('should format date-time as ""Day, Mon # <span>##:##</span>"', function formatDate_1() {
        expect(window.kTalk.lib.formatDate(new Date(2001, 0, 1))).toBe('Monday, Jan 1, <span>00:00</span>');
        expect(window.kTalk.lib.formatDate(new Date(2001, 0, 1, 1, 1, 1))).toBe('Monday, Jan 1, <span>01:01</span>');
        expect(window.kTalk.lib.formatDate(new Date(2001, 0, 1, 12, 30, 0))).toBe('Monday, Jan 1, <span>12:30</span>');
        expect(window.kTalk.lib.formatDate(new Date(2001, 0, 1, 23, 59, 59))).toBe('Monday, Jan 1, <span>23:59</span>');
      });

    });

    describe('.formatJson()', function formatJson_0() {

      it('should simplify JSON format', function formatJson_1() {
        expect(window.kTalk.lib.formatJson(true)).toBe('true');
        expect(window.kTalk.lib.formatJson(0)).toBe('0');
        expect(window.kTalk.lib.formatJson('A string')).toBe('A string');
        expect(window.kTalk.lib.formatJson('Multiline string\nSecond line')).toBe('Multiline string\\nSecond line');
        expect(window.kTalk.lib.formatJson({
          a: true,
          b: 0,
          c: 'A string',
          d: {
            da: 'One',
            db: 'Two'
          }
        })).toBe('    a: true\n    b: 0\n    c: A string\n    d:\n        da: One\n        db: Two');
        expect(window.kTalk.lib.formatJson(['One', 'Two', 'Three', 'Four'])).toBe('(\n    One\n    Two\n    Three\n    Four\n)');
        expect(window.kTalk.lib.formatJson({
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
        expect(window.kTalk.lib.encodeHtmlEntities('&')).toBe('&amp;');
        expect(window.kTalk.lib.encodeHtmlEntities('<')).toBe('&lt;');
        expect(window.kTalk.lib.encodeHtmlEntities('>')).toBe('&gt;');
        expect(window.kTalk.lib.encodeHtmlEntities('!@#$%^&*()_+-={}[]:";\'<>?,./`~ \n\u0000\r\u0127')).toBe('!@#$%^&amp;*()_+-={}[]:&#34;;\'&lt;&gt;?,./`~ &#10;&#0;&#13;&#295;');
      });

    });

    describe('.transformPlayerUri()', function transformPlayerUri_0() {

      it('should transform Youtube URLs', function transformPlayerUri_1() {
        expect(window.kTalk.lib.transformPlayerUri('http://www.youtube.com/?feature=player_embedded&v=dQw4w9WgXcQ')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=dQw4w9WgXcQ');
        expect(window.kTalk.lib.transformPlayerUri('http://www.youtube.com/?v=dQw4w9WgXcQ')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=dQw4w9WgXcQ');
        expect(window.kTalk.lib.transformPlayerUri('http://www.youtube.com/e/dQw4w9WgXcQ')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=dQw4w9WgXcQ');
        expect(window.kTalk.lib.transformPlayerUri('http://www.youtube.com/embed/0zM3nApSvMg?rel=0"')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=0zM3nApSvMg');
        expect(window.kTalk.lib.transformPlayerUri('http://www.youtube.com/embed/0zM3nApSvMg?rel=0')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=0zM3nApSvMg');
        expect(window.kTalk.lib.transformPlayerUri('http://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=dQw4w9WgXcQ');
        expect(window.kTalk.lib.transformPlayerUri('http://www.youtube.com/embed/nas1rJpm7wY?rel=0')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=nas1rJpm7wY');
        expect(window.kTalk.lib.transformPlayerUri('http://www.youtube.com/embed/NLqTHREEVbY')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=NLqTHREEVbY');
        expect(window.kTalk.lib.transformPlayerUri('http://www.youtube.com/user/IngridMichaelsonVEVO#p/a/u/1/KdwsulMb8EQ')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=KdwsulMb8EQ');
        expect(window.kTalk.lib.transformPlayerUri('http://www.youtube.com/user/IngridMichaelsonVEVO#p/a/u/1/QdK8U-VIH_o')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=QdK8U-VIH_o');
        expect(window.kTalk.lib.transformPlayerUri('http://www.youtube.com/user/IngridMichaelsonVEVO#p/u/11/KdwsulMb8EQ')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=KdwsulMb8EQ');
        expect(window.kTalk.lib.transformPlayerUri('http://www.youtube.com/user/Scobleizer#p/u/1/1p3NINEsYGo')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=1p3NINEsYGo');
        expect(window.kTalk.lib.transformPlayerUri('http://www.youtube.com/user/Scobleizer#p/u/1/1p3vcRhsYGo')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=1p3vcRhsYGo');
        expect(window.kTalk.lib.transformPlayerUri('http://www.youtube.com/user/Scobleizer#p/u/1/1p3vcRhsYGo?rel=0')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=1p3vcRhsYGo');
        expect(window.kTalk.lib.transformPlayerUri('http://www.youtube.com/user/Scobleizer#p/u/1/1p3vONEsYGo')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=1p3vONEsYGo');
        expect(window.kTalk.lib.transformPlayerUri('http://www.youtube.com/user/Scobleizer#p/u/1/1pSEVENsYGo')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=1pSEVENsYGo');
        expect(window.kTalk.lib.transformPlayerUri('http://www.youtube.com/user/SilkRoadTheatre#p/a/u/2/6dwqZw0j_jY')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=6dwqZw0j_jY');
        expect(window.kTalk.lib.transformPlayerUri('http://www.youtube.com/v/0zM3nApSvMg?fs=1&amp;hl=en_US&amp;rel=0')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=0zM3nApSvMg');
        expect(window.kTalk.lib.transformPlayerUri('http://www.youtube.com/v/0zM3nApSvMg?fs=1&hl=en_US&rel=0')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=0zM3nApSvMg');
        expect(window.kTalk.lib.transformPlayerUri('http://www.youtube.com/v/dQw4w9WgXcQ')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=dQw4w9WgXcQ');
        expect(window.kTalk.lib.transformPlayerUri('http://www.youtube.com/v/NLqAFFIVEbY?fs=1&hl=en_US')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=NLqAFFIVEbY');
        expect(window.kTalk.lib.transformPlayerUri('http://www.youtube.com/watch?feature=feedrec_grec_index&v=0zM3nApSvMg')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=0zM3nApSvMg');
        expect(window.kTalk.lib.transformPlayerUri('http://www.youtube.com/watch?feature=player_detailpage&v=8UVNT4wvIGY')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=8UVNT4wvIGY');
        expect(window.kTalk.lib.transformPlayerUri('http://www.youtube.com/watch?feature=player_embedded&v=dQw4w9WgXcQ')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=dQw4w9WgXcQ');
        expect(window.kTalk.lib.transformPlayerUri('http://www.youtube.com/watch?v=0zM3nApSvMg#t=0m10s')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=0zM3nApSvMg');
        expect(window.kTalk.lib.transformPlayerUri('http://www.youtube.com/watch?v=0zM3nApSvMg&feature=feedrec_grec_index')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=0zM3nApSvMg');
        expect(window.kTalk.lib.transformPlayerUri('http://www.youtube.com/watch?v=0zM3nApSvMg')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=0zM3nApSvMg');
        expect(window.kTalk.lib.transformPlayerUri('http://www.youtube.com/watch?v=0zM3nApSvMg/')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=0zM3nApSvMg');
        expect(window.kTalk.lib.transformPlayerUri('http://www.youtube.com/watch?v=6dwqZw0j_jY&feature=youtu.be')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=6dwqZw0j_jY');
        expect(window.kTalk.lib.transformPlayerUri('http://www.youtube.com/watch?v=cKZDdG9FTKY&feature=channel')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=cKZDdG9FTKY');
        expect(window.kTalk.lib.transformPlayerUri('http://www.youtube.com/watch?v=dQw4w9WgXcQ&feature=youtube_gdata_player')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=dQw4w9WgXcQ');
        expect(window.kTalk.lib.transformPlayerUri('http://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=dQw4w9WgXcQ');
        expect(window.kTalk.lib.transformPlayerUri('http://www.youtube.com/watch?v=JYATEN_TzhA&feature=featured')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=JYATEN_TzhA');
        expect(window.kTalk.lib.transformPlayerUri('http://www.youtube.com/watch?v=NLqASIXrVbY')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=NLqASIXrVbY');
        expect(window.kTalk.lib.transformPlayerUri('http://www.youtube.com/watch?v=peFZbP64dsU')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=peFZbP64dsU');
        expect(window.kTalk.lib.transformPlayerUri('http://www.youtube.com/watch?v=yZ-K7nCVnBI&playnext_from=TL&videos=osPknwzXEas&feature=sub')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=yZ-K7nCVnBI');
        expect(window.kTalk.lib.transformPlayerUri('http://www.youtube.com/ytscreeningroom?v=NRHEIGHTx8I')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=NRHEIGHTx8I');
        expect(window.kTalk.lib.transformPlayerUri('http://www.youtube.com/ytscreeningroom?v=NRHVzbJVx8I')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=NRHVzbJVx8I');
        expect(window.kTalk.lib.transformPlayerUri('http://youtu.be/0zM3nApSvMg')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=0zM3nApSvMg');
        expect(window.kTalk.lib.transformPlayerUri('http://youtu.be/6dwqZw0j_jY')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=6dwqZw0j_jY');
        expect(window.kTalk.lib.transformPlayerUri('http://youtu.be/afa-5HQHiAs')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=afa-5HQHiAs');
        expect(window.kTalk.lib.transformPlayerUri('http://youtu.be/dQw4w9WgXcQ')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=dQw4w9WgXcQ');
        expect(window.kTalk.lib.transformPlayerUri('http://youtu.be/dQw4w9WgXcQ?feature=youtube_gdata_player')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=dQw4w9WgXcQ');
        expect(window.kTalk.lib.transformPlayerUri('http://youtu.be/NLqAFTWOVbY')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=NLqAFTWOVbY');
        expect(window.kTalk.lib.transformPlayerUri('http://youtu.be/vfGY-laqamA')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=vfGY-laqamA');
        expect(window.kTalk.lib.transformPlayerUri('http://youtube.com/?v=dQw4w9WgXcQ&feature=youtube_gdata_player')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=dQw4w9WgXcQ');
        expect(window.kTalk.lib.transformPlayerUri('http://youtube.com/?vi=dQw4w9WgXcQ&feature=youtube_gdata_player')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=dQw4w9WgXcQ');
        expect(window.kTalk.lib.transformPlayerUri('http://youtube.com/v/dQw4w9WgXcQ?feature=youtube_gdata_player')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=dQw4w9WgXcQ');
        expect(window.kTalk.lib.transformPlayerUri('http://youtube.com/vi/dQw4w9WgXcQ?feature=youtube_gdata_player')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=dQw4w9WgXcQ');
        expect(window.kTalk.lib.transformPlayerUri('http://youtube.com/watch?v=dQw4w9WgXcQ&feature=youtube_gdata_player')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=dQw4w9WgXcQ');
        expect(window.kTalk.lib.transformPlayerUri('http://youtube.com/watch?vi=dQw4w9WgXcQ&feature=youtube_gdata_player')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=dQw4w9WgXcQ');
        expect(window.kTalk.lib.transformPlayerUri('https://www.youtube.com/watch?v=S09F5MejfBE')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=S09F5MejfBE');
      });

    });

  });

  describe('.getMessageToken()', function getMessageToken_0() {

    it('should return the token by number from the command message', function getMessageToken_1() {
      var command = {
        message: 'exec Addons.ExecuteAddon {"addonid":"script.test"}',
        regex: /^(exec)\s+([\w\.]+)\s+(\S+)$/i
      };
      
      expect(window.kTalk.getMessageToken(command, 1)).toBe('exec');
      expect(window.kTalk.getMessageToken(command, 2)).toBe('Addons.ExecuteAddon');
      expect(window.kTalk.getMessageToken(command, 3)).toBe('{"addonid":"script.test"}');
    });

  });

  describe('.makeMessageParams()', function makeMessageParams_0() {

    it('should make single message parameters object for Framework7.messages.addMessage() method', function makeMessageParams_1() {
      var params;

      window.kTalk.lastMessageTime = 0;
      params = window.kTalk.makeMessageParams('Message <text>', 'sent');
      expect(params.text).toBe('Message &lt;text&gt;');
      expect(params.type).toBe('sent');
      expect(params.day).toMatch(/^[0-9A-Z, ]+$/i);
      expect(params.time).toMatch(/^[0-9:]+$/i);
      expect(params.avatar).toBe(window.kTalk.avaSent);

      params = window.kTalk.makeMessageParams('Message <text>', 'received');
      expect(params.avatar).toBe(window.kTalk.avaRecv);
      expect(params.day).toBeUndefined();
      expect(params.time).toBeUndefined();
    });

  });

});
