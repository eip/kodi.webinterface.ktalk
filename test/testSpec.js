/*global jasmine, expect, describe, xdescribe, it, beforeEach, afterEach, spyOn*/
/*global Framework7*/
/*jshint -W053*/

describe('kTalk', function kTalk_0() {
  'use strict';

  var self = window.kTalk,
    jsonRpcProps = {
      kodi: {
        name: 'Kodi',
        version: {
          major: 16,
          minor: 1,
          revision: '60a76d9',
          tag: 'stable'

        }
      },
      ktalk: {
        addonid: 'plugin.webinterface.ktalk',
        name: 'Kodi Talk',
        type: 'xbmc.webinterface',
        version: '1.2.3'
      }
    };

  function stubAjaxRequests() {
    [{
      data: /JSONRPC\.Ping/,
      responseResult: 'pong'
    }, {
      data: /Application\.GetProperties.*"properties":\["name","version"\]/,
      responseResult: jsonRpcProps.kodi
    }, {
      data: /Addons\.GetAddonDetails.*"addonid":"plugin\.webinterface\.ktalk".*"properties":\["name","version"\]/,
      responseResult: {
        addon: jsonRpcProps.ktalk
      }
    }, {
      data: /Player\.GetActivePlayers/,
      responseResult: [{
        playerid: 1,
        type: 'video'
      }]
    }, {
      data: /Player\.GetItem.*"properties":\["artist","channeltype"\]/,
      responseResult: {
        item: {
          channeltype: 'tv',
          id: 33,
          label: 'World News',
          type: 'channel'
        }
      }
    }].forEach(function (r) {
      jasmine.Ajax.stubRequest(
        /\/jsonrpc/,
        r.data
      ).andReturn({
        status: 200,
        contentType: 'application/json',
        responseText: JSON.stringify({
          id: 0,
          jsonrpc: '2.0',
          result: r.responseResult
        })
      });
    });
  }

  function cloneObject(source) {
    var member,
      result = {};

    for (member in source) {
      if (source.hasOwnProperty(member)) {
        result[member] = source[member];
      }
    }
    return result;
  }

  function cloneCommand(name) {
    return cloneObject(self.testing.getCommand(name));
  }

  describe('Initialization', function initialization_0() {

    it('kTalk should be an object', function initialization_1() {
      expect(self).toEqual(jasmine.any(Object));
    });

    it('f7App should be a Framework7 object', function initialization_2() {
      expect(window.f7App).toEqual(jasmine.any(Framework7));
    });

    it('d7 should be a function', function initialization_3() {
      expect(window.d7).toEqual(jasmine.any(Function));
    });

    it('kTalk.messages should be initialized', function initialization_4() {
      expect(self.messages).toEqual(jasmine.any(Object));
      expect(self.messages.container[0]).toEqual(jasmine.any(window.HTMLDivElement));
      expect(self.messages.container[0].nodeType).toBe(1);
      expect(self.messages.params.autoLayout).toBe(true);
      expect(self.messages.params.messageTemplate).toMatch(/\{\{day\}\}\{\{#if time\}\},/);
      expect(self.messages.template({
        text: 'Hello',
        type: 'sent',
        day: 'Friday, May 4',
        time: '12:30',
        avatar: 'avatar.png'
      })).toMatch(/<div.*?>Friday, May 4, <span>12:30<\/span><\/div>.*sent.*Hello.*avatar\.png/);
      expect(self.messages.params.newMessagesFirst).toBe(false);
    });

    it('kTalk.messagebar should be initialized', function initialization_5() {
      expect(self.messagebar).toEqual(jasmine.any(Object));
      expect(self.messagebar.container[0]).toEqual(jasmine.any(window.HTMLDivElement));
      expect(self.messagebar.container[0].nodeType).toBe(1);
      expect(self.messagebar.textarea[0]).toEqual(jasmine.any(window.HTMLTextAreaElement));
      expect(self.messagebar.textarea[0].nodeType).toBe(1);
    });

    it('kTalk\'s members of primitive data types shold be initialized', function initialization_6() {
      expect(self.jsonRpcUrl).toEqual(jasmine.any(String));
      expect(self.avaRecv).toEqual(jasmine.any(String));
      expect(self.avaSent).toEqual(jasmine.any(String));
      expect(self.busy).toBe(false);
      expect(self.commandId).toBe(0);
      expect(self.lastMessageTime).toBe(0);
    });

    it('kTalk.commands should be initialized', function initialization_7() {
      expect(self.commands).toEqual(jasmine.any(Array));
      expect(self.commands.length).toBeGreaterThan(2);

      self.commands.forEach(function (c) {
        expect(['name', 'description', 'regex', 'method', 'params', 'answer']).toEqual(jasmine.arrayContaining(Object.keys(c)));
        expect(c.name).toEqual(jasmine.any(String));
        expect(['object', 'string', 'undefined']).toEqual(jasmine.arrayContaining([typeof c.description]));
        expect(c.regex).toEqual(jasmine.any(RegExp));
        expect(c.method || '').toEqual(jasmine.any(String));
        expect(['function', 'object', 'string', 'undefined']).toEqual(jasmine.arrayContaining([typeof c.params]));
        expect(['function', 'string', 'undefined']).toEqual(jasmine.arrayContaining([typeof c.answer]));
      });
    });

    it('kTalk.queue should be initialized', function initialization_8() {
      expect(self.queue).toEqual(jasmine.any(Object));
      expect(self.queue.commands).toEqual(jasmine.any(Array));
      expect(self.queue.commands.length).toBe(0);
      expect(self.queue.answers).toEqual(jasmine.any(Array));
      expect(self.queue.answers.length).toBe(0);
    });

  });

  describe('.testing [private methods]', function private_0() {

    describe('.q()', function q_0() {

      it('should return resolved promise with the given value', function q_1(done) {
        self.testing.q('Resolved').then(function (v) {
          expect(v).toBe('Resolved');
          done();
        }, function () {
          expect('Promise not').toBe('rejected');
          done();
        });
      });

    });

    describe('.qt()', function qt_0() {

      it('should return resolved promise with the given value', function qt_1(done) {
        self.testing.qt('Resolved', 1).then(function (v) {
          expect(v).toBe('Resolved');
          done();
        }, function () {
          expect('Promise not').toBe('rejected');
          done();
        });
      });

      it("promise should be resolved after 50 ms", function qt_2(done) {
        var delay = 50,
          startTime = Date.now();
        self.testing.qt('Resolved', delay).then(function (v) {
          expect(Date.now() - startTime).toBeCloseTo(delay, -2);
          done();
        }, function () {
          expect('Promise not').toBe('rejected');
          done();
        });
      });

      it("promise should be resolved after 500 ms (default)", function qt_3(done) {
        var delay = 500,
          startTime = Date.now();
        self.testing.qt('Resolved').then(function (v) {
          expect(Date.now() - startTime).toBeCloseTo(delay, -2);
          done();
        }, function () {
          expect('Promise not').toBe('rejected');
          done();
        });
      });

    });

    describe('.r()', function r_0() {

      it('should return rejected promise with the given value', function r_1(done) {
        self.testing.r('Rejected').then(function () {
          expect('Promise not').toBe('resolved');
          done();
        }, function (v) {
          expect(v).toBe('Rejected');
          done();
        });
      });

    });

    describe('.capitalize()', function capitalize_0() {

      it('should return string with the 1st letter in upper case', function capitalize_1() {
        expect(self.testing.capitalize('S')).toBe('S');
        expect(self.testing.capitalize('s')).toBe('S');
        expect(self.testing.capitalize('string')).toBe('String');
      });

      it('should return rest of the string in lower case', function capitalize_2() {
        expect(self.testing.capitalize('STRING')).toBe('String');
        expect(self.testing.capitalize('sTrInG')).toBe('String');
      });

    });

    describe('.formatDay()', function formatDay_0() {

      it('should format date as "Day, Mon #"', function formatDay_1() {
        expect(self.testing.formatDay()).toMatch(/^[A-Z][a-z]+, [A-Z][a-z]+ \d{1,2}$/);
        expect(self.testing.formatDay(new Date(2001, 0, 1))).toBe('Monday, Jan 1');
        expect(self.testing.formatDay(new Date(2001, 1, 6))).toBe('Tuesday, Feb 6');
        expect(self.testing.formatDay(new Date(2001, 2, 7))).toBe('Wednesday, Mar 7');
        expect(self.testing.formatDay(new Date(2001, 3, 5))).toBe('Thursday, Apr 5');
        expect(self.testing.formatDay(new Date(2001, 4, 4))).toBe('Friday, May 4');
        expect(self.testing.formatDay(new Date(2001, 5, 2))).toBe('Saturday, Jun 2');
        expect(self.testing.formatDay(new Date(2001, 6, 1))).toBe('Sunday, Jul 1');
        expect(self.testing.formatDay(new Date(2001, 7, 18))).toBe('Saturday, Aug 18');
        expect(self.testing.formatDay(new Date(2001, 8, 21))).toBe('Friday, Sep 21');
        expect(self.testing.formatDay(new Date(2001, 9, 25))).toBe('Thursday, Oct 25');
        expect(self.testing.formatDay(new Date(2001, 10, 28))).toBe('Wednesday, Nov 28');
        expect(self.testing.formatDay(new Date(2001, 11, 11))).toBe('Tuesday, Dec 11');
      });

    });

    describe('.formatTime()', function formatTime_0() {

      it('should format time as "##:##"', function formatTime_1() {
        expect(self.testing.formatTime()).toMatch(/^\d\d:\d\d$/);
        expect(self.testing.formatTime(new Date(2001, 0, 1))).toBe('00:00');
        expect(self.testing.formatTime(new Date(2001, 0, 1, 1, 1, 1))).toBe('01:01');
        expect(self.testing.formatTime(new Date(2001, 0, 1, 12, 30, 0))).toBe('12:30');
        expect(self.testing.formatTime(new Date(2001, 0, 1, 23, 59, 59))).toBe('23:59');
      });

    });

    describe('.formatDate()', function formatDate_0() {

      it('should format date-time as "Day, Mon #, <span>##:##</span>"', function formatDate_1() {
        expect(self.testing.formatDate()).toMatch(/^[A-Z][a-z]+, [A-Z][a-z]+ \d{1,2}, <span>\d\d:\d\d<\/span>$/);
        expect(self.testing.formatDate(new Date(2001, 0, 1))).toBe('Monday, Jan 1, <span>00:00</span>');
        expect(self.testing.formatDate(new Date(2001, 0, 1, 1, 1, 1))).toBe('Monday, Jan 1, <span>01:01</span>');
        expect(self.testing.formatDate(new Date(2001, 0, 1, 12, 30, 0))).toBe('Monday, Jan 1, <span>12:30</span>');
        expect(self.testing.formatDate(new Date(2001, 0, 1, 23, 59, 59))).toBe('Monday, Jan 1, <span>23:59</span>');
      });

    });

    describe('.formatJson()', function formatJson_0() {

      it('should simplify JSON format', function formatJson_1() {
        expect(self.testing.formatJson(true)).toBe('true');
        expect(self.testing.formatJson(0)).toBe('0');
        expect(self.testing.formatJson('A string')).toBe('A string');
        expect(self.testing.formatJson('Multiline string\nSecond line')).toBe('Multiline string\\nSecond line');
        expect(self.testing.formatJson({
          a: true,
          b: 0,
          c: 'A string',
          d: {
            da: 'One',
            db: 'Two'
          }
        })).toBe('    a: true\n    b: 0\n    c: A string\n    d:\n        da: One\n        db: Two');
        expect(self.testing.formatJson(['One', 'Two', 'Three', 'Four'])).toBe('(\n    One\n    Two\n    Three\n    Four\n)');
        expect(self.testing.formatJson({
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
        expect(self.testing.encodeHtmlEntities('&')).toBe('&amp;');
        expect(self.testing.encodeHtmlEntities('<')).toBe('&lt;');
        expect(self.testing.encodeHtmlEntities('>')).toBe('&gt;');
        expect(self.testing.encodeHtmlEntities('!@#$%^&*()_+-={}[]:";\'<>?,./`~ \n\u0000\r\u0127')).toBe('!@#$%^&amp;*()_+-={}[]:&#34;;\'&lt;&gt;?,./`~ &#10;&#0;&#13;&#295;');
        expect(self.testing.encodeHtmlEntities('𐀀𐀁𐀂𐀃')).toBe('&#65536;&#65537;&#65538;&#65539;');
      });

    });

    describe('.transformPlayerUri()', function transformPlayerUri_0() {

      it('should transform Youtube URLs', function transformPlayerUri_1() {
        expect(self.testing.transformPlayerUri('http://www.youtube.com/?feature=player_embedded&v=dQw4w9WgXcQ')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=dQw4w9WgXcQ');
        expect(self.testing.transformPlayerUri('http://www.youtube.com/?v=dQw4w9WgXcQ')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=dQw4w9WgXcQ');
        expect(self.testing.transformPlayerUri('http://www.youtube.com/e/dQw4w9WgXcQ')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=dQw4w9WgXcQ');
        expect(self.testing.transformPlayerUri('http://www.youtube.com/embed/0zM3nApSvMg?rel=0"')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=0zM3nApSvMg');
        expect(self.testing.transformPlayerUri('http://www.youtube.com/embed/0zM3nApSvMg?rel=0')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=0zM3nApSvMg');
        expect(self.testing.transformPlayerUri('http://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=dQw4w9WgXcQ');
        expect(self.testing.transformPlayerUri('http://www.youtube.com/embed/nas1rJpm7wY?rel=0')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=nas1rJpm7wY');
        expect(self.testing.transformPlayerUri('http://www.youtube.com/embed/NLqTHREEVbY')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=NLqTHREEVbY');
        expect(self.testing.transformPlayerUri('http://www.youtube.com/user/IngridMichaelsonVEVO#p/a/u/1/KdwsulMb8EQ')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=KdwsulMb8EQ');
        expect(self.testing.transformPlayerUri('http://www.youtube.com/user/IngridMichaelsonVEVO#p/a/u/1/QdK8U-VIH_o')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=QdK8U-VIH_o');
        expect(self.testing.transformPlayerUri('http://www.youtube.com/user/IngridMichaelsonVEVO#p/u/11/KdwsulMb8EQ')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=KdwsulMb8EQ');
        expect(self.testing.transformPlayerUri('http://www.youtube.com/user/Scobleizer#p/u/1/1p3NINEsYGo')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=1p3NINEsYGo');
        expect(self.testing.transformPlayerUri('http://www.youtube.com/user/Scobleizer#p/u/1/1p3vcRhsYGo')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=1p3vcRhsYGo');
        expect(self.testing.transformPlayerUri('http://www.youtube.com/user/Scobleizer#p/u/1/1p3vcRhsYGo?rel=0')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=1p3vcRhsYGo');
        expect(self.testing.transformPlayerUri('http://www.youtube.com/user/Scobleizer#p/u/1/1p3vONEsYGo')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=1p3vONEsYGo');
        expect(self.testing.transformPlayerUri('http://www.youtube.com/user/Scobleizer#p/u/1/1pSEVENsYGo')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=1pSEVENsYGo');
        expect(self.testing.transformPlayerUri('http://www.youtube.com/user/SilkRoadTheatre#p/a/u/2/6dwqZw0j_jY')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=6dwqZw0j_jY');
        expect(self.testing.transformPlayerUri('http://www.youtube.com/v/0zM3nApSvMg?fs=1&amp;hl=en_US&amp;rel=0')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=0zM3nApSvMg');
        expect(self.testing.transformPlayerUri('http://www.youtube.com/v/0zM3nApSvMg?fs=1&hl=en_US&rel=0')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=0zM3nApSvMg');
        expect(self.testing.transformPlayerUri('http://www.youtube.com/v/dQw4w9WgXcQ')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=dQw4w9WgXcQ');
        expect(self.testing.transformPlayerUri('http://www.youtube.com/v/NLqAFFIVEbY?fs=1&hl=en_US')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=NLqAFFIVEbY');
        expect(self.testing.transformPlayerUri('http://www.youtube.com/watch?feature=feedrec_grec_index&v=0zM3nApSvMg')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=0zM3nApSvMg');
        expect(self.testing.transformPlayerUri('http://www.youtube.com/watch?feature=player_detailpage&v=8UVNT4wvIGY')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=8UVNT4wvIGY');
        expect(self.testing.transformPlayerUri('http://www.youtube.com/watch?feature=player_embedded&v=dQw4w9WgXcQ')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=dQw4w9WgXcQ');
        expect(self.testing.transformPlayerUri('http://www.youtube.com/watch?v=0zM3nApSvMg#t=0m10s')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=0zM3nApSvMg');
        expect(self.testing.transformPlayerUri('http://www.youtube.com/watch?v=0zM3nApSvMg&feature=feedrec_grec_index')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=0zM3nApSvMg');
        expect(self.testing.transformPlayerUri('http://www.youtube.com/watch?v=0zM3nApSvMg')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=0zM3nApSvMg');
        expect(self.testing.transformPlayerUri('http://www.youtube.com/watch?v=0zM3nApSvMg/')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=0zM3nApSvMg');
        expect(self.testing.transformPlayerUri('http://www.youtube.com/watch?v=6dwqZw0j_jY&feature=youtu.be')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=6dwqZw0j_jY');
        expect(self.testing.transformPlayerUri('http://www.youtube.com/watch?v=cKZDdG9FTKY&feature=channel')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=cKZDdG9FTKY');
        expect(self.testing.transformPlayerUri('http://www.youtube.com/watch?v=dQw4w9WgXcQ&feature=youtube_gdata_player')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=dQw4w9WgXcQ');
        expect(self.testing.transformPlayerUri('http://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=dQw4w9WgXcQ');
        expect(self.testing.transformPlayerUri('http://www.youtube.com/watch?v=JYATEN_TzhA&feature=featured')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=JYATEN_TzhA');
        expect(self.testing.transformPlayerUri('http://www.youtube.com/watch?v=NLqASIXrVbY')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=NLqASIXrVbY');
        expect(self.testing.transformPlayerUri('http://www.youtube.com/watch?v=peFZbP64dsU')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=peFZbP64dsU');
        expect(self.testing.transformPlayerUri('http://www.youtube.com/watch?v=yZ-K7nCVnBI&playnext_from=TL&videos=osPknwzXEas&feature=sub')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=yZ-K7nCVnBI');
        expect(self.testing.transformPlayerUri('http://www.youtube.com/ytscreeningroom?v=NRHEIGHTx8I')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=NRHEIGHTx8I');
        expect(self.testing.transformPlayerUri('http://www.youtube.com/ytscreeningroom?v=NRHVzbJVx8I')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=NRHVzbJVx8I');
        expect(self.testing.transformPlayerUri('http://youtu.be/0zM3nApSvMg')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=0zM3nApSvMg');
        expect(self.testing.transformPlayerUri('http://youtu.be/6dwqZw0j_jY')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=6dwqZw0j_jY');
        expect(self.testing.transformPlayerUri('http://youtu.be/afa-5HQHiAs')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=afa-5HQHiAs');
        expect(self.testing.transformPlayerUri('http://youtu.be/dQw4w9WgXcQ')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=dQw4w9WgXcQ');
        expect(self.testing.transformPlayerUri('http://youtu.be/dQw4w9WgXcQ?feature=youtube_gdata_player')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=dQw4w9WgXcQ');
        expect(self.testing.transformPlayerUri('http://youtu.be/NLqAFTWOVbY')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=NLqAFTWOVbY');
        expect(self.testing.transformPlayerUri('http://youtu.be/vfGY-laqamA')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=vfGY-laqamA');
        expect(self.testing.transformPlayerUri('http://youtube.com/?v=dQw4w9WgXcQ&feature=youtube_gdata_player')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=dQw4w9WgXcQ');
        expect(self.testing.transformPlayerUri('http://youtube.com/?vi=dQw4w9WgXcQ&feature=youtube_gdata_player')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=dQw4w9WgXcQ');
        expect(self.testing.transformPlayerUri('http://youtube.com/v/dQw4w9WgXcQ?feature=youtube_gdata_player')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=dQw4w9WgXcQ');
        expect(self.testing.transformPlayerUri('http://youtube.com/vi/dQw4w9WgXcQ?feature=youtube_gdata_player')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=dQw4w9WgXcQ');
        expect(self.testing.transformPlayerUri('http://youtube.com/watch?v=dQw4w9WgXcQ&feature=youtube_gdata_player')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=dQw4w9WgXcQ');
        expect(self.testing.transformPlayerUri('http://youtube.com/watch?vi=dQw4w9WgXcQ&feature=youtube_gdata_player')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=dQw4w9WgXcQ');
        expect(self.testing.transformPlayerUri('https://www.youtube.com/watch?v=S09F5MejfBE')).toBe('plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=S09F5MejfBE');
      });

      it('should not transform other URLs', function transformPlayerUri_2() {
        expect(self.testing.transformPlayerUri('http://www.sample-videos.com/video/mp4/720/big_buck_bunny_720p_50mb.mp4')).toBe('http://www.sample-videos.com/video/mp4/720/big_buck_bunny_720p_50mb.mp4');
      });

    });

    describe('.getMessageToken()', function getMessageToken_0() {

      it('should return the token by number from the command message', function getMessageToken_1() {
        var command = {
          message: 'exec Addons.ExecuteAddon {"addonid":"script.test"}',
          regex: /^(exec)\s+([\w\.]+)\s+(\S+)$/i
        };

        expect(self.testing.getMessageToken(command, 1)).toBe('exec');
        expect(self.testing.getMessageToken(command, 2)).toBe('Addons.ExecuteAddon');
        expect(self.testing.getMessageToken(command, 3)).toBe('{"addonid":"script.test"}');
      });

    });

    describe('.getCommand()', function getCommand_0() {

      it('should find the command in the commands array by name', function getCommand_1() {
        expect(self.testing.getCommand('hello')).toEqual(jasmine.any(Object));
        expect(self.testing.getCommand('help.detail')).toEqual(jasmine.any(Object));
        expect(self.testing.getCommand('what\'s up')).toEqual(jasmine.any(Object));
      });

    });

    describe('.getCommandDescription()', function getCommandDescription_0() {

      it('should return the description of the command', function getCommandDescription_1() {
        expect(self.testing.getCommandDescription(cloneCommand('hello'))).toBe('');
        expect(self.testing.getCommandDescription(cloneCommand('home'))).toBe('Show the home screen.');
        expect(self.testing.getCommandDescription(cloneCommand('help'))).toBe('List of available commands.' +
          '\nI also understand you if you type "[[Help]]", "[[Help!]]", "[[help?]]"…' +
          '\nSend me "help command" for detailed description of the command, for example, "[[help play]]" or "[[help tv]]".');
      });

      it('should return the first line of the description of the command if "short" parameter is true', function getCommandDescription_2() {
        expect(self.testing.getCommandDescription(cloneCommand('hello'), true)).toBe('');
        expect(self.testing.getCommandDescription(cloneCommand('home'), 1)).toBe('Show the home screen.');
        expect(self.testing.getCommandDescription(cloneCommand('help'), true)).toBe('List of available commands. [[(…)||help help]]');
        expect(self.testing.getCommandDescription(cloneCommand('help'), 'short')).toBe('List of available commands. [[(…)||help help]]');
      });

    });

    describe('.makeLinks()', function makeLinks_0() {

      it('should replace "[[text]]" and "[[text||command]]" in the string to "<a ...>...</a>" tags', function makeLinks_1() {
        expect(self.testing.makeLinks('Example <text> with link &templates "[[help]]", "[[Help!]]", "[[Help?..||help]]"…')).toBe('Example &lt;text&gt; with link &amp;templates &#34;<a href="#" class="new link" data-command="help">help</a>&#34;, &#34;<a href="#" class="new link" data-command="Help!">Help!</a>&#34;, &#34;<a href="#" class="new link" data-command="help">Help?..</a>&#34;&#8230;');
      });

      it('should wrap entire string into "<a ...>...</a>" tag if "entire" parameter is true', function makeLinks_2() {
        expect(self.testing.makeLinks('Help!', true)).toBe('<a href="#" class="new link" data-command="Help!">Help!</a>');
      });

      it('should return original string if is not containing "[[...]]"', function makeLinks_3() {
        expect(self.testing.makeLinks('Example text without link templates.')).toBe('Example text without link templates.');
      });

    });

    describe('.messageLinkHandler()', function messageLinkHandler_0() {
      var event;

      beforeEach(function () {
        event = {
          target: {
            dataset: {
              command: 'command'
            }
          }
        };
        self.messagebar.clear();
      });

      it('should set message bar input to "command"', function messageLinkHandler_1() {
        expect(self.testing.messageLinkHandler(event)).toBeUndefined();
        expect(self.messagebar.value()).toBe('command');
      });

      it('should set message bar input to "help command" if message bar already contains "help"', function messageLinkHandler_2() {
        self.messagebar.value('help');
        expect(self.testing.messageLinkHandler(event)).toBeUndefined();
        expect(self.messagebar.value()).toBe('help command');
        self.messagebar.value('Help! ');
        expect(self.testing.messageLinkHandler(event)).toBeUndefined();
        expect(self.messagebar.value()).toBe('Help! command');
        self.messagebar.value('help');
        event.target.dataset.command = 'help';
        expect(self.testing.messageLinkHandler(event)).toBeUndefined();
        expect(self.messagebar.value()).toBe('help help');
      });

      it('should set message bar input to "command" if message bar contains other text but "help"', function messageLinkHandler_3() {
        self.messagebar.value('play');
        expect(self.testing.messageLinkHandler(event)).toBeUndefined();
        expect(self.messagebar.value()).toBe('command');
      });

    });

    describe('.makeMessageParams()', function makeMessageParams_0() {
      var params;

      it('should make single message parameters object for Framework7.messages.addMessage() method', function makeMessageParams_1() {
        self.lastMessageTime = 0;
        params = self.testing.makeMessageParams('Message <a href="#">text</a>', 'sent');
        expect(params.text).toBe('Message <a href="#">text</a>');
        expect(params.type).toBe('sent');
        expect(params.day).toMatch(/^[0-9A-Z, ]+$/i);
        expect(params.time).toMatch(/^[0-9:]+$/i);
        expect(params.avatar).toBe(self.avaSent);

        params = self.testing.makeMessageParams('Message <a href="#">text</a>', 'received');
        expect(params.avatar).toBe(self.avaRecv);
        expect(params.day).toBeUndefined();
        expect(params.time).toBeUndefined();
      });

    });

    describe('.checkMessage()', function checkMessage_0() {

      it('should return rejected promise if message string is empty', function checkMessage_1(done) {
        self.testing.checkMessage('').then(function () {
          expect('Promise not').toBe('resolved');
          done();
        }, function (v) {
          expect(v).toBeUndefined();
          done();
        });
      });

      it('should return rejected promise if message string is "."', function checkMessage_2(done) {
        self.testing.checkMessage('.').then(function () {
          expect('Promise not').toBe('resolved');
          done();
        }, function (v) {
          expect(v).toBeUndefined();
        });
        self.testing.checkMessage('....').then(function () {
          expect('Promise not').toBe('resolved');
          done();
        }, function (v) {
          expect(v).toBeUndefined();
          done();
        });
      });

      it('should return resolved promise with the command object and command.message set to message string', function checkMessage_3(done) {
        self.testing.checkMessage('Help').then(function (v) {
          expect(v).toEqual({
            message: 'Help'
          });
          done();
        }, function () {
          expect('Promise not').toBe('rejected');
          done();
        });
      });

      it('should set command.silent to true if message string starts with "."', function checkMessage_4(done) {
        self.testing.checkMessage('.Help').then(function (v) {
          expect(v).toEqual({
            message: 'Help',
            silent: true
          });
        }, function () {
          expect('Promise not').toBe('rejected');
          done();
        });
        self.testing.checkMessage('....Help').then(function (v) {
          expect(v).toEqual({
            message: 'Help',
            silent: true
          });
          done();
        }, function () {
          expect('Promise not').toBe('rejected');
          done();
        });
      });

    });

    describe('.addQuestionMessage()', function addQuestionMessage_0() {
      var command;

      beforeEach(function () {
        command = {
          message: 'Help <span>me</span>!'
        };
        self.lastMessageTime = Date.now();
        spyOn(self.messages, 'addMessage');
      });

      it('should make command link from message and call kTalk.messages.addMessage method, and return unchanged command object', function addQuestionMessage_1() {
        expect(self.testing.addQuestionMessage(cloneObject(command))).toEqual(command);
        expect(self.messages.addMessage).toHaveBeenCalledWith({
          type: 'sent',
          text: '<a href="#" class="new link" data-command="Help &lt;span&gt;me&lt;/span&gt;!">Help &lt;span&gt;me&lt;/span&gt;!</a>',
          avatar: 'img/i-form-name-ios-114x114.png'
        });
      });

      it('should not call kTalk.messages.addMessage method if command.silent is true, and return unchanged command object', function addQuestionMessage_2() {
        command.silent = true;
        expect(self.testing.addQuestionMessage(cloneObject(command))).toEqual(command);
        expect(self.messages.addMessage).not.toHaveBeenCalled();
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
          params_u: undefined,
          params_fs: function (c) {
            return JSON.stringify(result);
          },
          params_fo: function (c) {
            return result;
          },
          params_fb: function (c) {
            return true;
          },
          params_fn: function (c) {
            return 123;
          },
          params_fu: function (c) {
            return;
          },
          params_fp: function (c) {
            return self.testing.qt('Promise', 5);
          },
          params_ts: '{"command":"$1","properties":["$2",$3]}',
          params_to: {
            command: '$1',
            properties: ['$2', '$3']
          },
          params_ta: ['$1', '$2', '$3']
        };
      });

      it('should return undefined if the property is undefined or doesn\'t exists', function parseProperty_1() {
        expect(self.testing.parseProperty(command, 'foo')).toBeUndefined();
        expect(self.testing.parseProperty(command, 'bar')).toBeUndefined();
        expect(self.testing.parseProperty(command, 'params_u')).toBeUndefined();
      });

      it('should return result of the property(command) call if the property is a function', function parseProperty_2() {
        expect(self.testing.parseProperty(command, 'params_fs')).toBe(JSON.stringify(result));
        expect(self.testing.parseProperty(command, 'params_fo')).toEqual(result);
        expect(self.testing.parseProperty(command, 'params_fb')).toBe(true);
        expect(self.testing.parseProperty(command, 'params_fn')).toBe(123);
        expect(self.testing.parseProperty(command, 'params_fu')).toBeUndefined();
      });

      it('and should correctly process case if property(command) returns a promise', function parseProperty_3(done) {
        self.testing.parseProperty(command, 'params_fp').then(function (v) {
          expect(v).toBe('Promise');
          done();
        }, function () {
          expect('Promise not').toBe('rejected');
          done();
        });
      });

      it('should return the property value if the property is not a function', function parseProperty_4() {
        expect(self.testing.parseProperty(command, 'params_s')).toBe(JSON.stringify(result));
        expect(self.testing.parseProperty(command, 'params_o')).toEqual(result);
        expect(self.testing.parseProperty(command, 'params_b')).toBe(true);
        expect(self.testing.parseProperty(command, 'params_n')).toBe(123);
      });

      it('should substitute $# in result with the tokens from command.message', function parseProperty_5() {
        var result_s = JSON.stringify({
            command: 'Hello',
            properties: ['Kodi', 123]
          }),
          result_o = {
            command: 'Hello',
            properties: ['Kodi', '123']
          },
          result_a = ['Hello', 'Kodi', '123'];

        expect(self.testing.parseProperty(command, 'params_ts')).toBe(result_s);
        expect(self.testing.parseProperty(command, 'params_to')).toEqual(result_o);
        expect(self.testing.parseProperty(command, 'params_ta')).toEqual(result_a);
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
        result = cloneCommand('hello');

        command.message = 'hello';
        result.message = command.message;
        expect(self.testing.parseKodiCommand(command)).toEqual(jasmine.objectContaining(result));

        command.message = 'hello!';
        result.message = command.message;
        expect(self.testing.parseKodiCommand(command)).toEqual(jasmine.objectContaining(result));

        command.message = 'Hello ?';
        result.message = command.message;
        expect(self.testing.parseKodiCommand(command)).toEqual(jasmine.objectContaining(result));
      });

      it('should successfully parse "help" command', function parseKodiCommand_2() {
        result = cloneCommand('help');

        command.message = 'help';
        result.message = command.message;
        expect(self.testing.parseKodiCommand(command)).toEqual(jasmine.objectContaining(result));

        command.message = 'Help.';
        result.message = command.message;
        expect(self.testing.parseKodiCommand(command)).toEqual(jasmine.objectContaining(result));

        command.message = 'Help !';
        result.message = command.message;
        expect(self.testing.parseKodiCommand(command)).toEqual(jasmine.objectContaining(result));
      });

      it('should successfully parse "player.getitem" command', function parseKodiCommand_3() {
        command.message = 'player.getitem 1';
        result = cloneCommand('player.getitem');
        result.message = command.message;
        result.params = {
          playerid: 1,
          properties: ['artist', 'channeltype']
        };
        expect(self.testing.parseKodiCommand(command)).toEqual(jasmine.objectContaining(result));
      });

      it('should successfully parse "player.playpause" command', function parseKodiCommand_4() {
        command.message = 'player.playpause 2 1';
        result = cloneCommand('player.playpause');
        result.message = command.message;
        result.params = {
          playerid: 2,
          play: true
        };
        expect(self.testing.parseKodiCommand(command)).toEqual(jasmine.objectContaining(result));
      });

      it('should successfully parse "debug" command', function parseKodiCommand_5() {
        result = cloneCommand('debug');

        command.message = 'debug true';
        result.message = command.message;
        expect(self.testing.parseKodiCommand(command)).toEqual(jasmine.objectContaining(result));

        command.message = 'Debug  window';
        result.message = command.message;
        expect(self.testing.parseKodiCommand(command)).toEqual(jasmine.objectContaining(result));

        command.message = 'DEBUG window.kTalk';
        result.message = command.message;
        expect(self.testing.parseKodiCommand(command)).toEqual(jasmine.objectContaining(result));
      });

      it('should return rejected promise for unknown command', function parseKodiCommand_6(done) {
        command.message = 'Fake message.';
        self.testing.parseKodiCommand(command).then(function () {
          expect('Promise not').toBe('resolved');
          done();
        }, function (v) {
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
          id: self.commandId + 1,
          jsonrpc: "2.0"
        };
        response = {
          status: 200,
          contentType: headers['Content-Type'],
          responseText: {
            id: self.commandId + 1,
            jsonrpc: '2.0'
          }
        };
        jasmine.Ajax.install();
      });

      afterEach(function () {
        jasmine.Ajax.uninstall();
      });

      it('should call JSONRPC.Ping method via XMLHttpRequest and return resolved promise with result in the command.response', function callJsonRpcMethod_1(done) {
        command = cloneCommand('ping');
        data.method = command.method;
        data.params = {};
        result = cloneObject(command);
        result.response = 'pong';
        response.responseText.result = result.response;
        response.responseText = JSON.stringify(response.responseText);

        self.testing.callJsonRpcMethod(command).then(function (v) {
          expect(v).toEqual(jasmine.objectContaining(result));
          done();
        }, function () {
          expect('Promise not').toBe('rejected');
          done();
        });
        xhr = jasmine.Ajax.requests.mostRecent();
        expect(xhr.method).toBe(xhrMethod);
        expect(xhr.url).toBe(self.jsonRpcUrl);
        expect(xhr.requestHeaders).toEqual(jasmine.objectContaining(headers));
        expect(xhr.data()).toEqual(jasmine.objectContaining(data));
        xhr.respondWith(response);
      });

      it('should call Player.Open method via XMLHttpRequest and return resolved promise with result in the command.response', function callJsonRpcMethod_2(done) {
        command = cloneCommand('exec');
        command.method = 'Player.Open';
        command.params = {
          item: {
            file: 'plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=YE7VzlLtp-4'
          }
        };
        data.method = command.method;
        data.params = command.params;
        result = cloneObject(command);
        result.response = 'OK';
        response.responseText.result = result.response;
        response.responseText = JSON.stringify(response.responseText);

        self.testing.callJsonRpcMethod(command).then(function (v) {
          expect(v).toEqual(jasmine.objectContaining(result));
          done();
        }, function () {
          expect('Promise not').toBe('rejected');
          done();
        });
        xhr = jasmine.Ajax.requests.mostRecent();
        expect(xhr.method).toBe(xhrMethod);
        expect(xhr.url).toBe(self.jsonRpcUrl);
        expect(xhr.requestHeaders).toEqual(jasmine.objectContaining(headers));
        expect(xhr.data()).toEqual(jasmine.objectContaining(data));
        xhr.respondWith(response);
      });

      it('should call JSONRPC.Fake method via XMLHttpRequest and return rejected promise with error description', function callJsonRpcMethod_3(done) {
        data.method = 'JSONRPC.Fake';
        data.params = {
          foo: {
            bar: '!@#$%^&*()_+-={}[]:";\'<>?,./`~ \n'
          }
        };
        command = cloneCommand('exec');
        command.method = data.method;
        command.params = data.params;
        result = {
          code: -32601,
          message: 'Method not found.'
        };
        response.responseText.error = result;
        response.responseText = JSON.stringify(response.responseText);

        self.testing.callJsonRpcMethod(command).then(function () {
          expect('Promise not').toBe('resolved');
          done();
        }, function (v) {
          expect(v).toEqual(jasmine.objectContaining(result));
          done();
        });
        xhr = jasmine.Ajax.requests.mostRecent();
        expect(xhr.method).toBe(xhrMethod);
        expect(xhr.url).toBe(self.jsonRpcUrl);
        expect(xhr.requestHeaders).toEqual(jasmine.objectContaining(headers));
        expect(xhr.data()).toEqual(jasmine.objectContaining(data));
        xhr.respondWith(response);
      });

      it('should call JSONRPC.Ping method via XMLHttpRequest and return rejected promise if server responds with 404 HTTP status', function callJsonRpcMethod_4(done) {
        command = cloneCommand('ping');
        data.method = command.method;
        data.params = {};
        response.status = 404;
        response.contentType = 'text/html';
        response.responseText = '<html><head><title>File not found</title></head><body>File not found</body></html>';
        result = {
          code: response.status.toString(),
          message: 'Failed to complete JSON-RPC request to the Kodi server.'
        };

        self.testing.callJsonRpcMethod(command).then(function () {
          expect('Promise not').toBe('resolved');
          done();
        }, function (v) {
          expect(v).toEqual(jasmine.objectContaining(result));
          done();
        });
        xhr = jasmine.Ajax.requests.mostRecent();
        expect(xhr.method).toBe(xhrMethod);
        expect(xhr.url).toBe(self.jsonRpcUrl);
        expect(xhr.requestHeaders).toEqual(jasmine.objectContaining(headers));
        expect(xhr.data()).toEqual(jasmine.objectContaining(data));
        xhr.respondWith(response);
      });

      it('should\'t send XMLHttpRequest if command has no "method" property and just return command object', function callJsonRpcMethod_5() {
        command = cloneCommand('hello');
        expect(self.testing.callJsonRpcMethod(command)).toBe(command);
      });

    });

    describe('.formatAnswerMessage()', function formatAnswerMessage_0() {
      var command, result, resultStr;

      beforeEach(function () {
        command = {};
        result = {
          num: 1,
          str: 'String',
          arr: [0, 1, 2],
          boot: true
        };
        resultStr = 'OK, the answer is:&#10;    num: 1&#10;    str: String&#10;    arr: (&#10;        0&#10;        1&#10;        2&#10;    )&#10;    boot: true';
        self.queue.commands.length = 0;
        self.queue.answers.length = 0;
      });

      describe('should return promise resolved with the parsed command.answer property', function formatAnswerMessage_1() {

        it('and command.answer is a string', function formatAnswerMessage_11(done) {
          command.answer = 'Test';
          self.testing.formatAnswerMessage(command).then(function (v) {
            expect(v).toBe('Test');
            expect(self.queue.answers.length).toBe(0);
            done();
          }, function () {
            expect('Promise not').toBe('rejected');
            done();
          });
        });

        it('and command.answer is a number', function formatAnswerMessage_12(done) {
          command.answer = 123;
          self.testing.formatAnswerMessage(command).then(function (v) {
            expect(v).toBe('123');
            expect(self.queue.answers.length).toBe(0);
            done();
          }, function () {
            expect('Promise not').toBe('rejected');
            done();
          });
        });

        it('and command.answer is an object', function formatAnswerMessage_13(done) {
          command.answer = result;
          self.testing.formatAnswerMessage(command).then(function (v) {
            expect(v).toBe(resultStr);
            expect(self.queue.answers.length).toBe(0);
            done();
          }, function () {
            expect('Promise not').toBe('rejected');
            done();
          });
        });

        it('and command.answer is a function that return a string', function formatAnswerMessage_14(done) {
          command.answer = function () {
            return 'Test';
          };
          self.testing.formatAnswerMessage(command).then(function (v) {
            expect(v).toBe('Test');
            expect(self.queue.answers.length).toBe(0);
            done();
          }, function () {
            expect('Promise not').toBe('rejected');
            done();
          });
        });

        it('and command.answer is a function that return a number', function formatAnswerMessage_15(done) {
          command.answer = function () {
            return 123;
          };
          self.testing.formatAnswerMessage(command).then(function (v) {
            expect(v).toBe('123');
            expect(self.queue.answers.length).toBe(0);
            done();
          }, function () {
            expect('Promise not').toBe('rejected');
            done();
          });
        });

        it('and command.answer is a function that return an object', function formatAnswerMessage_16(done) {
          command.answer = function () {
            return result;
          };
          self.testing.formatAnswerMessage(command).then(function (v) {
            expect(v).toBe(resultStr);
            expect(self.queue.answers.length).toBe(0);
            done();
          }, function () {
            expect('Promise not').toBe('rejected');
            done();
          });
        });

        it('and command.answer is a function that return a promise', function formatAnswerMessage_17(done) {
          command.answer = function () {
            return self.testing.qt(result, 5);
          };
          self.testing.formatAnswerMessage(command).then(function (v) {
            expect(v).toBe(resultStr);
            expect(self.queue.answers.length).toBe(0);
            done();
          }, function () {
            expect('Promise not').toBe('rejected');
            done();
          });
        });

      });

      describe('should return promise resolved with the formatted command.response property if command.answer is not defined', function formatAnswerMessage_2() {

        it('and command.response is a string', function formatAnswerMessage_21(done) {
          command.response = 'Test';
          self.testing.formatAnswerMessage(command).then(function (v) {
            expect(v).toBe('Test!');
            expect(self.queue.answers.length).toBe(0);
            done();
          }, function () {
            expect('Promise not').toBe('rejected');
            done();
          });
        });

        it('and command.response is a number', function formatAnswerMessage_22(done) {
          command.response = 123;
          self.testing.formatAnswerMessage(command).then(function (v) {
            expect(v).toBe('123');
            expect(self.queue.answers.length).toBe(0);
            done();
          }, function () {
            expect('Promise not').toBe('rejected');
            done();
          });
        });

        it('and command.response is an object', function formatAnswerMessage_23(done) {
          command.response = result;
          self.testing.formatAnswerMessage(command).then(function (v) {
            expect(v).toBe(resultStr);
            expect(self.queue.answers.length).toBe(0);
            done();
          }, function () {
            expect('Promise not').toBe('rejected');
            done();
          });
        });

      });

      describe('should push non empty value in kTalk.queue.answers if kTalk.queue.commands is not empty, and return promise resolved with the empty string', function formatAnswerMessage_3() {

        it('and command.answer is a string', function formatAnswerMessage_31(done) {
          command.answer = 'Test';
          self.queue.commands.push(command);
          self.testing.formatAnswerMessage(command).then(function (v) {
            expect(v).toBe('');
            expect(self.queue.answers.length).toBe(1);
            expect(self.queue.answers[0]).toBe('Test');
            done();
          }, function () {
            expect('Promise not').toBe('rejected');
            done();
          });
        });

        it('and command.answer is an object', function formatAnswerMessage_32(done) {
          command.answer = function () {
            return result;
          };
          self.queue.commands.push(command);
          self.testing.formatAnswerMessage(command).then(function (v) {
            expect(v).toBe('');
            expect(self.queue.answers.length).toBe(1);
            expect(self.queue.answers[0]).toEqual(result);
            done();
          }, function () {
            expect('Promise not').toBe('rejected');
            done();
          });
        });

        it('and command.answer is a function that return a promise resolved with an object', function formatAnswerMessage_33(done) {
          command.answer = function () {
            return self.testing.qt(result, 5);
          };
          self.queue.commands.push(command);
          self.testing.formatAnswerMessage(command).then(function (v) {
            expect(v).toBe('');
            expect(self.queue.answers.length).toBe(1);
            expect(self.queue.answers[0]).toBe(result);
            done();
          }, function () {
            expect('Promise not').toBe('rejected');
            done();
          });
        });

        it('and command.response is a string', function formatAnswerMessage_34(done) {
          command.response = 'Test';
          self.queue.commands.push(command);
          self.testing.formatAnswerMessage(command).then(function (v) {
            expect(v).toBe('');
            expect(self.queue.answers.length).toBe(1);
            expect(self.queue.answers[0]).toBe('Test!');
            done();
          }, function () {
            expect('Promise not').toBe('rejected');
            done();
          });
        });

        it('and command.response is an object', function formatAnswerMessage_35(done) {
          command.response = result;
          self.queue.commands.push(command);
          self.testing.formatAnswerMessage(command).then(function (v) {
            expect(v).toBe('');
            expect(self.queue.answers.length).toBe(1);
            expect(self.queue.answers[0]).toBe(result);
            done();
          }, function () {
            expect('Promise not').toBe('rejected');
            done();
          });
        });

        it('but should not push empty value in kTalk.queue.answers', function formatAnswerMessage_36(done) {
          command.answer = '';
          self.queue.commands.push(command);
          self.testing.formatAnswerMessage(command).then(function (v) {
            expect(v).toBe('');
            expect(self.queue.answers.length).toBe(0);
          }, function () {
            expect('Promise not').toBe('rejected');
            done();
          });

          command.answer = function () {
            return self.testing.qt('', 5);
          };
          self.queue.commands.push(command);
          self.testing.formatAnswerMessage(command).then(function (v) {
            expect(v).toBe('');
            expect(self.queue.answers.length).toBe(0);
            done();
          }, function () {
            expect('Promise not').toBe('rejected');
            done();
          });
        });

      });

    });

    describe('.formatErrorMessage()', function formatErrorMessage_0() {

      it('should return an empty string if message is undefined', function formatErrorMessage_1() {
        expect(self.testing.formatErrorMessage()).toBe('');
        expect(self.testing.formatErrorMessage(undefined)).toBe('');
      });

      it('should return formatted string if message is object', function formatErrorMessage_2() {
        var msg = {
          message: 'Sample error message'
        };

        expect(self.testing.formatErrorMessage(msg)).toBe('ERROR: Sample error message');
        msg.code = 246;
        expect(self.testing.formatErrorMessage(msg)).toBe('ERROR 246: Sample error message');
        msg.name = 'Test error';
        expect(self.testing.formatErrorMessage(msg)).toBe('ERROR 246: [Test error] Sample error message');
        msg.code = undefined;
        expect(self.testing.formatErrorMessage(msg)).toBe('ERROR: [Test error] Sample error message');
        msg.code = 0;
        expect(self.testing.formatErrorMessage(msg)).toBe('ERROR: [Test error] Sample error message');
      });

      it('should return a trimmed string value if message is of pprimitive data type', function formatErrorMessage_3() {
        expect(self.testing.formatErrorMessage(0)).toBe('0');
        expect(self.testing.formatErrorMessage(true)).toBe('true');
        expect(self.testing.formatErrorMessage('Message')).toBe('Message');
        expect(self.testing.formatErrorMessage('\n Another message\n\t')).toBe('Another message');
      });

    });

    describe('.addReceivedMessage()', function addReceivedMessage_0() {

      beforeEach(function () {
        self.messages.clean();
      });

      it('should return promise with null result if formatted message is empty string', function addReceivedMessage_1(done) {
        self.testing.addReceivedMessage('').then(function (v) {
          expect(v).toBe(null);
          done();
        }, function () {
          expect('Promise not').toBe('rejected');
          done();
        });
      });

      it('should return promise with <div> element containing message', function addReceivedMessage_2(done) {
        self.testing.addReceivedMessage('Sample <span>message</span>').then(function (v) {
          expect(v).toEqual(jasmine.any(window.HTMLDivElement));
          expect(v.classList.contains('message-received')).toBe(true);
          expect(v.firstElementChild.innerHTML).toBe('Sample <span>message</span>');
          done();
        }, function () {
          expect('Promise not').toBe('rejected');
          done();
        });
      });

      it('should return promise with <div> element with "error" class', function addReceivedMessage_3(done) {
        self.testing.addReceivedMessage('Sample message', null, 'error').then(function (v) {
          expect(v).toEqual(jasmine.any(window.HTMLDivElement));
          expect(v.classList.contains('message-received')).toBe(true);
          expect(v.classList.contains('error')).toBe(true);
          expect(v.firstElementChild.innerHTML).toBe('Sample message');
          done();
        }, function () {
          expect('Promise not').toBe('rejected');
          done();
        });
      });

      it('should return promise with <div> element with "debug" class if message begins with "#"', function addReceivedMessage_4(done) {
        self.testing.addReceivedMessage('#Debug message', null, 'error').then(function (v) {
          expect(v).toEqual(jasmine.any(window.HTMLDivElement));
          expect(v.classList.contains('message-received')).toBe(true);
          expect(v.classList.contains('error')).toBe(false);
          expect(v.classList.contains('debug')).toBe(true);
          expect(v.firstElementChild.innerHTML).toBe('#Debug message');
          done();
        }, function () {
          expect('Promise not').toBe('rejected');
          done();
        });
      });

    });

    describe('.addAnswerMessage()', function addAnswerMessage_0() {
      var command;

      beforeEach(function () {
        command = {};
        self.queue.commands.length = 0;
        self.messages.clean();
      });

      it('should return promise with <div> element containing formatted message from command object', function addAnswerMessage_1(done) {
        command.answer = 'Sample <span>message</span>';
        self.testing.addAnswerMessage(command).then(function (v) {
          expect(v).toEqual(jasmine.any(window.HTMLDivElement));
          expect(v.classList.contains('message-received')).toBe(true);
          expect(v.firstElementChild.innerHTML).toBe('Sample &lt;span&gt;message&lt;/span&gt;');
          done();
        }, function () {
          expect('Promise not').toBe('rejected');
          done();
        });
      });

    });

    describe('.addErrorMessage()', function addErrorMessage_0() {

      it('should return promise with <div> element containing formatted error message', function addErrorMessage_1(done) {
        self.testing.addErrorMessage('Sample error <span>message</span>').then(function (v) {
          expect(v).toEqual(jasmine.any(window.HTMLDivElement));
          expect(v.classList.contains('message-received')).toBe(true);
          expect(v.classList.contains('error')).toBe(true);
          expect(v.firstElementChild.innerHTML).toBe('Sample error <span>message</span>');
          done();
        }, function () {
          expect('Promise not').toBe('rejected');
          done();
        });
      });

    });

    describe('.sendCommand()', function sendCommand_0() {

      beforeEach(function () {
        jasmine.Ajax.install();
        stubAjaxRequests();
        self.messages.clean();
      });

      afterEach(function () {
        jasmine.Ajax.uninstall();
      });

      it('should send "hello" command and return greetings message', function sendCommand_1(done) {
        self.testing.sendCommand('Hello!').then(function (v) {
          expect(v).toEqual(jasmine.any(window.HTMLDivElement));
          expect(v.classList.contains('message-received')).toBe(true);
          expect(v.firstElementChild.innerHTML).toBe('Hello, I\'m a Kodi Talk bot.' +
            '\n\nSend me a media URL you want to play or any other command.' +
            '\nTo list all commands I understand, type "<a href="#" class="new link" data-command="help">help</a>".');
          done();
        }, function () {
          expect('Promise not').toBe('rejected');
          done();
        });
      });

      it('should send "ping" command and return "pong!" message', function sendCommand_2(done) {
        self.testing.sendCommand('Ping').then(function (v) {
          expect(v).toEqual(jasmine.any(window.HTMLDivElement));
          expect(v.classList.contains('message-received')).toBe(true);
          expect(v.firstElementChild.innerHTML).toBe('pong!');
          done();
        }, function () {
          expect('Promise not').toBe('rejected');
          done();
        });
      });

    });

    describe('.sendQueuedCommand()', function sendQueuedCommand_0() {

      beforeEach(function () {
        jasmine.Ajax.install();
        stubAjaxRequests();
        self.queue.commands.length = 0;
        self.queue.answers.length = 0;
        self.commandId = 0;
        self.messages.clean();
      });

      afterEach(function () {
        jasmine.Ajax.uninstall();
      });

      it('should return "Finished." string if command queue is empty', function sendQueuedCommand_1() {
        expect(self.testing.sendQueuedCommand()).toBe('Finished.');
      });

      it('should send "hello" and "ping" queued commands and return "Finished." string', function sendQueuedCommand_2(done) {
        self.queue.commands.push('Hello!');
        self.queue.commands.push('Ping');
        self.queue.commands.push('Ping');
        self.testing.sendQueuedCommand().then(function (v) {
          expect(v).toBe('Finished.');
          expect(self.commandId).toBe(2); // Two JSON-RPC commands should be sent
          done();
        }, function () {
          expect('Promise not').toBe('rejected');
          done();
        });
      });

    });

    describe('.talkToKodi()', function talkToKodi_0() {

      beforeEach(function () {
        jasmine.Ajax.install();
        stubAjaxRequests();
        self.queue.commands.length = 0;
        self.queue.answers.length = 0;
        self.commandId = 0;
        self.messages.clean();
      });

      afterEach(function () {
        jasmine.Ajax.uninstall();
      });

      it('should send "ping" command and return "Finished." string', function talkToKodi_1(done) {
        self.testing.talkToKodi('Ping').then(function (v) {
          expect(v).toBe('Finished.');
          expect(self.commandId).toBe(1); // Two JSON-RPC commands should be sent
          done();
        }, function () {
          expect('Promise not').toBe('rejected');
          done();
        });
      });

    });

    describe('.addGreetings()', function addGreetings_0() {

      beforeEach(function () {
        jasmine.Ajax.install();
        stubAjaxRequests();
        self.queue.commands.length = 0;
        self.queue.answers.length = 0;
        self.commandId = 0;
        self.messages.clean();
      });

      afterEach(function () {
        jasmine.Ajax.uninstall();
      });

      it('should add messages with answers from ".hello", ".version" and ".what\'s up?" commands', function addGreetings_1(done) {
        var messages;
        self.testing.addGreetings().then(function (v) {
          expect(v).toBe('Finished.');
          messages = window.d7('.message-text');
          expect(messages.length).toBe(3);
          expect(messages[0].innerHTML).toBe('Hello, I\'m a Kodi Talk bot.' +
            '\n\nSend me a media URL you want to play or any other command.' +
            '\nTo list all commands I understand, type "<a href="#" class="new link" data-command="help">help</a>".');
          expect(messages[1].innerHTML).toBe('Kodi 16.1 (rev. 60a76d9)\nKodi Talk addon 1.2.3');
          expect(messages[2].innerHTML).toBe('Now playing:\n‣ TV channel <a href="#" class="new link" data-command="play tv 33">33</a>: World News');
          expect(self.commandId).toBe(4);
          done();
        }, function () {
          expect('Promise not').toBe('rejected');
          done();
        });
      });

    });

  });

  describe('[public methods]', function public_0() {

    describe('.sendMessage()', function sendMessage_0() {

      it('should send messages in sequence, waiting 300 ms if previous command still processing; should clear messagebar value', function sendMessage_1(done) {
        var delay_1, startTime_1, delay_2, startTime_2, messages;

        self.messages.clean();
        delay_1 = 100;
        expect(self.busy).toBe(false);
        startTime_1 = Date.now();
        self.sendMessage('delay ' + delay_1).then(function (v) {
          expect(Date.now() - startTime_1).toBeCloseTo(delay_1, -2);
          expect(self.busy).toBe(false);
          messages = window.d7('.message-text');
          expect(messages.length).toBe(2);
          expect(messages[1].innerHTML).toBe('Waiting ' + delay_1 + ' ms.');
        }, function () {
          expect('Promise not').toBe('rejected');
          done();
        });

        delay_2 = 50;
        self.messagebar.value('delay ' + delay_2);
        expect(self.busy).toBe(true);
        startTime_2 = Date.now();
        self.sendMessage().then(function (v) {
          expect(Date.now() - startTime_2).toBeCloseTo(300 + delay_2, -2);
          expect(self.busy).toBe(false);
          expect(self.messagebar.value()).toBe('');
          messages = window.d7('.message-text');
          expect(messages.length).toBe(4);
          expect(messages[3].innerHTML).toBe('Waiting ' + delay_2 + ' ms.');
          done();
        }, function () {
          expect('Promise not').toBe('rejected');
          done();
        });
        expect(self.busy).toBe(true);
      });

    });

  });

  describe('Commands', function commands_0() {

    describe('descriptions', function descriptions_0() {

      it('each line should begins with uppercase letter (may be prefixed with "★ ") and ends with "." or "…"', function descriptions_1() {
        self.commands.forEach(function (c) {
          var d = c.description;

          if (!d) {
            return;
          }
          if (!window.d7.isArray(d)) {
            d = [d];
          }
          d.forEach(function (s) {
            expect(s).toMatch(/^(?:★ )?[A-Z].*?[\.…]$/);
          });
        });
      });

    });

    describe('answers', function answers_0() {
      var command;

      describe('player.getitem', function answers_1() {

        beforeEach(function () {
          command = cloneCommand('player.getitem');
        });

        it('should format TV channel', function answers_11() {
          command.response = {
            item: {
              channeltype: 'tv',
              id: 33,
              label: 'World News',
              type: 'channel'
            }
          };
          expect(command.answer(command)).toBe('‣ TV channel [[33||play tv 33]]: World News');
        });

      });
    });

  });

});
