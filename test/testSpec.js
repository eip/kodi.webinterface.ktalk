/*global jasmine, expect, describe, xdescribe, it, beforeEach, afterEach, spyOn*/
/*global Framework7*/

describe('kTalk', function kTalk_0() {
  'use strict';

  var self = window.kTalk,
    realSetTimeout = window.setTimeout,
    store = {
      getItem: function (key) {
        return store[key];
      },
      setItem: function (key, value) {
        return (store[key] = value.toString());
      },
      removeItem: function (key) {
        delete store[key];
      }
    },
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

  function checkSpyDelayedCall(delay, spy, done) {
    jasmine.clock().tick(delay - 1);
    realSetTimeout(function () {
      expect(spy).not.toHaveBeenCalled();
      jasmine.clock().tick(2);
      realSetTimeout(function () {
        expect(spy).toHaveBeenCalled();
        done();
      }, 1);
    }, 1);
  }

  self.dataStorage = store;
  self.dataStorage = store;

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
      expect(self.dataKey).toEqual(jasmine.any(String));
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

    it('kTalk.dataStorage should be initialized', function initialization_9() {
      expect(self.dataStorage).toEqual(jasmine.any(Object));
      expect(self.dataStorage.getItem).toEqual(jasmine.any(Function));
      expect(self.dataStorage.setItem).toEqual(jasmine.any(Function));
      expect(self.dataStorage.removeItem).toEqual(jasmine.any(Function));
      expect(self.dataStorage.clear).toBeUndefined(); // should not to be real localStorage object
    });

  });

  describe('.testing [private methods]', function private_0() {

    describe('.q()', function q_0() {

      it('should return resolved promise with the given value', function q_1(done) {
        self.testing.q('Resolved').then(function (v) {
          expect(v).toBe('Resolved');
          done();
        }, function () {
          done.fail('Promise should not be rejected');
        });
      });

    });

    describe('.qt()', function qt_0() {

      it('should return resolved promise with the given value', function qt_1(done) {
        self.testing.qt('Resolved', 1).then(function (v) {
          expect(v).toBe('Resolved');
          done();
        }, function () {
          done.fail('Promise should not be rejected');
        });
      });

      it("promise should be resolved after 50 ms", function qt_2(done) {
        var delay = 50,
          startTime = Date.now();
        self.testing.qt('Resolved', delay).then(function (v) {
          expect(Date.now() - startTime).toBeCloseTo(delay, -2);
          done();
        }, function () {
          done.fail('Promise should not be rejected');
        });
      });

      it("promise should be resolved after 500 ms (default)", function qt_3(done) {
        var delay = 500,
          startTime = Date.now();
        self.testing.qt('Resolved').then(function (v) {
          expect(Date.now() - startTime).toBeCloseTo(delay, -2);
          done();
        }, function () {
          done.fail('Promise should not be rejected');
        });
      });

    });

    describe('.r()', function r_0() {

      it('should return rejected promise with the given value', function r_1(done) {
        self.testing.r('Rejected').then(function () {
          done.fail('Promise should not be resolved');
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
        expect(self.testing.capitalize('sTrInG')).toBe('STrInG');
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

      it('should transform YouTube URLs', function transformPlayerUri_1() {
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
        expect(self.testing.getCommandDescription(cloneCommand('echo'))).toBe('');
        expect(self.testing.getCommandDescription(cloneCommand('home'))).toBe('Show the home screen.');
        expect(self.testing.getCommandDescription(cloneCommand('help'))).toBe('List of available commands.' +
          '\nI also understand you if you type "[[Help]]", "[[Help!]]", "[[help?]]"…' +
          '\nSend me "help command" for detailed description of the command, for example, "[[help play]]" or "[[help tv]]".');
      });

      it('should return the first line of the description of the command if "short" parameter is true', function getCommandDescription_2() {
        expect(self.testing.getCommandDescription(cloneCommand('echo'), true)).toBe('');
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

    describe('.loadSettings()', function loadSettings_0() {

      beforeEach(function () {
        var i,
          history,
          date,
          text,
          type;

        delete self.appData.messages;
        history = [];
        text = 'Message text';
        type = 'received';
        date = new Date(2001, 0, 1, 12, 30, 0);
        for (i = 1; i <= self.messageHistorySize; ++i) {
          history.push({
            text: text + '-' + i,
            type: type,
            date: new Date(date.getTime() + i * 60000)
          });
        }
        self.dataStorage.setItem(self.dataKey, JSON.stringify({
          messages: history
        }));
      });

      it('should load kTalk.appData.messages from the data storage', function loadSettings_1() {
        expect(self.appData.messages).toBeUndefined();
        self.testing.loadSettings();
        expect(self.appData.messages).toEqual(jasmine.any(Array));
        expect(self.appData.messages.length).toBe(self.messageHistorySize);
      });

    });

    describe('.saveSettings()', function saveSettings_0() {

      beforeEach(function () {
        var i,
          date,
          text,
          type;

        self.appData.messages = [];
        text = 'Message text';
        type = 'received';
        date = new Date(2001, 0, 1, 12, 30, 0);
        for (i = 1; i <= self.messageHistorySize; ++i) {
          self.appData.messages.push({
            text: text + '-' + i,
            type: type,
            date: new Date(date.getTime() + i * 60000)
          });
        }
        self.dataStorage.removeItem(self.dataKey);
      });

      it('should save kTalk.appData.messages to the data storage', function saveSettings_1() {
        expect(self.dataStorage.getItem(self.dataKey)).toBeUndefined();
        self.testing.saveSettings();
        expect(self.dataStorage.getItem(self.dataKey)).toBe(JSON.stringify({
          messages: self.appData.messages
        }));
      });

    });

    describe('.addMessageToHistory()', function addMessageToHistory_0() {
      var date,
        text,
        type;

      beforeEach(function () {
        date = new Date(2001, 0, 1, 12, 30, 0);
        text = 'Message text';
        type = 'received';
        delete self.appData.messages;
        self.dataStorage.removeItem(self.dataKey);
      });

      it('should add message to the history', function addMessageToHistory_1() {
        self.testing.addMessageToHistory(text, type, date);
        expect(self.appData.messages.length).toBe(1);
        expect(self.appData.messages[0]).toEqual({
          date: date,
          text: text,
          type: type
        });
        expect(self.dataStorage.getItem(self.dataKey)).toBe(JSON.stringify({
          messages: self.appData.messages
        }));
      });

      it('should remove old messages from the history to maintain maximum history size', function addMessageToHistory_2() {
        var i;

        for (i = 1; i <= self.messageHistorySize + 10; ++i) {
          self.testing.addMessageToHistory(text + '-' + i, type, new Date(date.getTime() + i * 60000));
        }
        expect(self.appData.messages.length).toBe(self.messageHistorySize);
        expect(self.appData.messages[0]).toEqual({
          date: new Date(date.getTime() + 11 * 60000),
          text: text + '-' + 11,
          type: type
        });
        expect(self.appData.messages[self.messageHistorySize - 1]).toEqual({
          date: new Date(date.getTime() + (self.messageHistorySize + 10) * 60000),
          text: text + '-' + (self.messageHistorySize + 10),
          type: type
        });
        expect(self.dataStorage.getItem(self.dataKey)).toBe(JSON.stringify({
          messages: self.appData.messages
        }));
      });

    });

    describe('.makeMessageParams()', function makeMessageParams_0() {
      var params;

      beforeEach(function () {
        self.appData.messages.length = 0;
      });

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

      it('should use "date" parameter if defined', function makeMessageParams_2() {
        self.lastMessageTime = 0;
        params = self.testing.makeMessageParams('Message text', 'received', new Date(2001, 0, 1, 12, 30, 0));
        expect(params.day).toBe('Monday, Jan 1');
        expect(params.time).toBe('12:30');
        expect(self.lastMessageTime).toBe(new Date(2001, 0, 1, 12, 30, 0).getTime());
      });

      it('should add message to history', function makeMessageParams_3() {
        params = self.testing.makeMessageParams('Message text', 'received', new Date(2001, 0, 1, 12, 30, 0));
        expect(self.appData.messages.length).toBe(1);
        expect(self.appData.messages[0]).toEqual({
          date: new Date(2001, 0, 1, 12, 30, 0),
          text: 'Message text',
          type: 'received'
        });
      });

      it('should not add message to history if "noHistory" parameter is set', function makeMessageParams_4() {
        params = self.testing.makeMessageParams('Message text', 'received', new Date(2001, 0, 1, 12, 30, 0), true);
        expect(self.appData.messages.length).toBe(0);
      });

    });

    describe('.checkMessage()', function checkMessage_0() {

      it('should return rejected promise if message string is empty', function checkMessage_1(done) {
        self.testing.checkMessage('').then(function () {
          done.fail('Promise should not be resolved');
        }, function (v) {
          expect(v).toBeUndefined();
          done();
        });
      });

      it('should return rejected promise if message string is "."', function checkMessage_2(done) {
        self.testing.checkMessage('.').then(function () {
          done.fail('Promise should not be resolved');
        }, function (v) {
          expect(v).toBeUndefined();
        });
        self.testing.checkMessage('....').then(function () {
          done.fail('Promise should not be resolved');
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
          done.fail('Promise should not be rejected');
        });
      });

      it('should set command.silent to true if message string starts with "."', function checkMessage_4(done) {
        self.testing.checkMessage('.Help').then(function (v) {
          expect(v).toEqual({
            message: 'Help',
            silent: true
          });
        }, function () {
          done.fail('Promise should not be rejected');
        });
        self.testing.checkMessage('....Help').then(function (v) {
          expect(v).toEqual({
            message: 'Help',
            silent: true
          });
          done();
        }, function () {
          done.fail('Promise should not be rejected');
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
          done.fail('Promise should not be rejected');
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
          done.fail('Promise should not be resolved');
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
          done.fail('Promise should not be rejected');
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
          done.fail('Promise should not be rejected');
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
          done.fail('Promise should not be resolved');
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
          done.fail('Promise should not be resolved');
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
            done.fail('Promise should not be rejected');
          });
        });

        it('and command.answer is a number', function formatAnswerMessage_12(done) {
          command.answer = 123;
          self.testing.formatAnswerMessage(command).then(function (v) {
            expect(v).toBe('123');
            expect(self.queue.answers.length).toBe(0);
            done();
          }, function () {
            done.fail('Promise should not be rejected');
          });
        });

        it('and command.answer is an object', function formatAnswerMessage_13(done) {
          command.answer = result;
          self.testing.formatAnswerMessage(command).then(function (v) {
            expect(v).toBe(resultStr);
            expect(self.queue.answers.length).toBe(0);
            done();
          }, function () {
            done.fail('Promise should not be rejected');
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
            done.fail('Promise should not be rejected');
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
            done.fail('Promise should not be rejected');
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
            done.fail('Promise should not be rejected');
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
            done.fail('Promise should not be rejected');
          });
        });

      });

      describe('should return promise resolved with the formatted command.response property if command.answer is not defined', function formatAnswerMessage_2() {

        it('and command.response is a string', function formatAnswerMessage_21(done) {
          command.response = 'Test';
          self.testing.formatAnswerMessage(command).then(function (v) {
            expect(v).toBe('Test!');
            expect(self.queue.answers.length).toBe(0);
          }, function () {
            done.fail('Promise should not be rejected');
          });
          command.response = 'tesT';
          self.testing.formatAnswerMessage(command).then(function (v) {
            expect(v).toBe('TesT!');
            expect(self.queue.answers.length).toBe(0);
            done();
          }, function () {
            done.fail('Promise should not be rejected');
          });
        });

        it('and command.response is a number', function formatAnswerMessage_22(done) {
          command.response = 123;
          self.testing.formatAnswerMessage(command).then(function (v) {
            expect(v).toBe('123');
            expect(self.queue.answers.length).toBe(0);
            done();
          }, function () {
            done.fail('Promise should not be rejected');
          });
        });

        it('and command.response is an object', function formatAnswerMessage_23(done) {
          command.response = result;
          self.testing.formatAnswerMessage(command).then(function (v) {
            expect(v).toBe(resultStr);
            expect(self.queue.answers.length).toBe(0);
            done();
          }, function () {
            done.fail('Promise should not be rejected');
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
            done.fail('Promise should not be rejected');
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
            done.fail('Promise should not be rejected');
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
            done.fail('Promise should not be rejected');
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
            done.fail('Promise should not be rejected');
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
            done.fail('Promise should not be rejected');
          });
        });

        it('but should not push undefined value in kTalk.queue.answers', function formatAnswerMessage_36(done) {
          command.answer = void 0;
          self.queue.commands.push(command);
          self.testing.formatAnswerMessage(command).then(function (v) {
            expect(v).toBe('');
            expect(self.queue.answers.length).toBe(0);
          }, function () {
            done.fail('Promise should not be rejected');
          });

          command.answer = function () {
            return self.testing.qt(void 0, 5);
          };
          self.queue.commands.push(command);
          self.testing.formatAnswerMessage(command).then(function (v) {
            expect(v).toBe('');
            expect(self.queue.answers.length).toBe(0);
            done();
          }, function () {
            done.fail('Promise should not be rejected');
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
          done.fail('Promise should not be rejected');
        });
      });

      it('should return promise with <div> element containing message', function addReceivedMessage_2(done) {
        self.testing.addReceivedMessage('Sample <span>message</span>').then(function (v) {
          expect(v).toEqual(jasmine.any(window.HTMLDivElement));
          expect(v.classList.contains('message-received')).toBe(true);
          expect(v.firstElementChild.innerHTML).toBe('Sample <span>message</span>');
          done();
        }, function () {
          done.fail('Promise should not be rejected');
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
          done.fail('Promise should not be rejected');
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
          done.fail('Promise should not be rejected');
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
          done.fail('Promise should not be rejected');
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
          done.fail('Promise should not be rejected');
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

      it('should send "echo" command and return a given message', function sendCommand_1(done) {
        self.testing.sendCommand('Echo Hello!').then(function (v) {
          expect(v).toEqual(jasmine.any(window.HTMLDivElement));
          expect(v.classList.contains('message-received')).toBe(true);
          expect(v.firstElementChild.innerHTML).toBe('Hello!');
          done();
        }, function () {
          done.fail('Promise should not be rejected');
        });
      });

      it('should send "ping" command and return "pong!" message', function sendCommand_2(done) {
        self.testing.sendCommand('Ping').then(function (v) {
          expect(v).toEqual(jasmine.any(window.HTMLDivElement));
          expect(v.classList.contains('message-received')).toBe(true);
          expect(v.firstElementChild.innerHTML).toBe('Pong!');
          done();
        }, function () {
          done.fail('Promise should not be rejected');
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

      it('should send "echo" and "ping" queued commands and return "Finished." string', function sendQueuedCommand_2(done) {
        self.queue.commands.push('echo Hello!');
        self.queue.commands.push('Ping');
        self.queue.commands.push('Ping');
        self.testing.sendQueuedCommand().then(function (v) {
          expect(v).toBe('Finished.');
          expect(self.commandId).toBe(2); // Two JSON-RPC commands should be sent
          done();
        }, function () {
          done.fail('Promise should not be rejected');
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
          done.fail('Promise should not be rejected');
        });
      });

    });

    describe('.addMessagesFromHistory()', function addMessagesFromHistory_0() {

      beforeEach(function () {
        self.messages.clean();
        spyOn(self.testing.getCommand('hello'), 'answer').and.returnValue('Hello!');
      });

      it('should add messages stored in the message history', function addMessagesFromHistory_1() {
        var messages;

        self.appData.messages = [{
          text: 'Hi!',
          type: 'sent',
          date: new Date(2001, 0, 1, 12, 10, 0)
        }, {
          text: 'Hello!',
          type: 'received',
          date: new Date(2001, 0, 1, 12, 11, 0)
        }, {
          text: 'What?',
          type: 'sent',
          date: new Date(2001, 0, 1, 12, 25, 0)
        }, {
          text: 'Sorry, I can\'t understand you.',
          type: 'received error',
          date: new Date(2001, 0, 1, 12, 26, 0)
        }, {
          text: 'debug 2+2',
          type: 'sent',
          date: new Date(2001, 0, 1, 12, 40, 0)
        }, {
          text: '# answer: 4',
          type: 'received debug',
          date: new Date(2001, 0, 1, 12, 41, 0)
        }];
        self.dataStorage.setItem(self.dataKey, JSON.stringify(self.appData));

        self.testing.addMessagesFromHistory();
        messages = window.d7('.message-text');
        expect(messages.length).toBe(6);

        expect(messages[0].innerHTML).toBe('Hi!');
        expect(messages[0].parentElement.classList.contains('message-sent')).toBe(true);
        expect(messages[0].parentElement.classList.contains('error')).toBe(false);
        expect(messages[0].parentElement.classList.contains('debug')).toBe(false);

        expect(messages[1].innerHTML).toBe('Hello!');
        expect(messages[1].parentElement.classList.contains('message-received')).toBe(true);
        expect(messages[1].parentElement.classList.contains('error')).toBe(false);
        expect(messages[1].parentElement.classList.contains('debug')).toBe(false);

        expect(messages[2].innerHTML).toBe('What?');
        expect(messages[2].parentElement.classList.contains('message-sent')).toBe(true);
        expect(messages[2].parentElement.classList.contains('error')).toBe(false);
        expect(messages[2].parentElement.classList.contains('debug')).toBe(false);

        expect(messages[3].innerHTML).toBe('Sorry, I can\'t understand you.');
        expect(messages[3].parentElement.classList.contains('message-received')).toBe(true);
        expect(messages[3].parentElement.classList.contains('error')).toBe(true);
        expect(messages[3].parentElement.classList.contains('debug')).toBe(false);

        expect(messages[4].innerHTML).toBe('debug 2+2');
        expect(messages[4].parentElement.classList.contains('message-sent')).toBe(true);
        expect(messages[4].parentElement.classList.contains('error')).toBe(false);
        expect(messages[4].parentElement.classList.contains('debug')).toBe(false);

        expect(messages[5].innerHTML).toBe('# answer: 4');
        expect(messages[5].parentElement.classList.contains('message-received')).toBe(true);
        expect(messages[5].parentElement.classList.contains('error')).toBe(false);
        expect(messages[5].parentElement.classList.contains('debug')).toBe(true);

        expect(self.appData.messages).toEqual(jasmine.any(Array));
        expect(self.appData.messages.length).toBe(6);
      });

      it('should add welcome message if the message history is empty', function addMessagesFromHistory_2(done) {
        var messages;

        self.appData.messages.length = 0;
        self.testing.addMessagesFromHistory().then(function (v) {
          messages = window.d7('.message-text');
          expect(messages.length).toBe(1);
          expect(messages[0].innerHTML).toBe('Hello!');
          expect(messages[0].parentElement.classList.contains('message-received')).toBe(true);
          expect(messages[0].parentElement.classList.contains('error')).toBe(false);
          expect(messages[0].parentElement.classList.contains('debug')).toBe(false);
          expect(self.appData.messages).toEqual(jasmine.any(Array));
          expect(self.appData.messages.length).toBe(1);
          done();
        }, function () {
          done.fail('Promise should not be rejected');
        });
      });

      it('should add welcome message if the message history contains single message', function addMessagesFromHistory_3(done) {
        var messages;

        self.appData.messages = [{
          text: 'Welcome!',
          type: 'received',
          date: new Date(2001, 0, 1, 12, 0, 0)
        }];
        self.testing.addMessagesFromHistory().then(function (v) {
          messages = window.d7('.message-text');
          expect(messages.length).toBe(1);
          expect(messages[0].innerHTML).toBe('Hello!');
          expect(messages[0].parentElement.classList.contains('message-received')).toBe(true);
          expect(messages[0].parentElement.classList.contains('error')).toBe(false);
          expect(messages[0].parentElement.classList.contains('debug')).toBe(false);
          expect(self.appData.messages).toEqual(jasmine.any(Array));
          expect(self.appData.messages.length).toBe(1);
          done();
        }, function () {
          done.fail('Promise should not be rejected');
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
          done.fail('Promise should not be rejected');
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
          done.fail('Promise should not be rejected');
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
            expect(s).toMatch(/^(?:★ )?[A-Z].*\S[\.…]$/);
          });
        });
      });

    });

    describe('answers', function answers_0() {
      var command;

      describe('hello', function answers_hello_0() {

        beforeEach(function () {
          command = cloneCommand('hello');
          command.message = 'Hello!';
          self.queue.commands.length = 0;
          self.queue.answers.length = 0;
          self.appData.messages = [{
            text: 'Welcome!',
            type: 'received',
            date: new Date()
          }];
          self.lastMessageTime = Date.now();
        });

        it('should push commands to kTalk.queue.commands and return "Hello, I\'m a Kodi Talk bot." string', function answers_hello_1() {
          expect(command.answer(command)).toBe('Hello, I\'m a Kodi Talk bot.');
          expect(self.appData.messages).toBeUndefined();
          expect(self.dataStorage.getItem(self.dataKey)).toBe('{}');
          expect(self.queue.commands.length).toBeGreaterThan(4);
          expect(self.queue.commands[0]).toBe('.version.addon plugin.webinterface.ktalk');
          expect(self.queue.commands[1]).toBe('.version.kodi');
          expect(self.queue.commands.slice(-1)[0]).toBe('.what\'s up');
        });

      });

      describe('help', function answers_help_0() {

        beforeEach(function () {
          command = cloneCommand('help');
        });

        it('should return the formatted list of the commands names and descriptions', function answers_help_1() {
          var answer = command.answer(command);

          expect(answer).toEqual(jasmine.any(String));
          expect(answer).toMatch(/^I understand the following commmands:\n(?:‣.*\.(?: \[\[\(…\)\|\|[\w ]*\]\])?\n)+\nSend me.*"\[\[help tv\]\]"\.$/);
        });

      });

      describe('help.detail', function answers_help_detail_0() {

        beforeEach(function () {
          command = cloneCommand('help.detail');
        });

        it('should return the formatted name and full description of the "stop" command', function answers_help_detail_1() {
          command.message = 'help stop';
          expect(command.answer(command)).toBe('[[stop]]: Stop playback.');
        });

        it('should return "Sorry..." if the given command has no description', function answers_help_detail_2() {
          command.message = 'help player.getitem';
          expect(command.answer(command)).toBe('Sorry, I don\'t know anything about "player.getitem" command.');
        });

        it('should return "Sorry..." if the given command doesn\'t exists', function answers_help_detail_3() {
          command.message = 'help foo';
          expect(command.answer(command)).toBe('Sorry, I don\'t know anything about "foo" command.');
        });

      });

      describe('play.url', function answers_play_url_0() {

        beforeEach(function () {
          command = cloneCommand('play.url');
          command.message = 'play https://youtu.be/YE7VzlLtp-4';
          self.queue.commands.length = 0;
          self.queue.answers.length = 0;
        });

        it('should push commands to kTalk.queue.commands and return "Start playing URL..." string', function answers_play_url_1() {
          expect(command.answer(command)).toBe('Start playing URL: plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=YE7VzlLtp-4');
          expect(self.queue.commands.length).toBeGreaterThan(3);
          expect(self.queue.commands[0]).toBe('.stop');
          expect(self.queue.commands.slice(-1)[0]).toBe('.what\'s up');
        });

      });

      describe('play.tv', function answers_play_tv_0() {

        beforeEach(function () {
          command = cloneCommand('play.tv');
          command.message = 'play tv 123';
          self.queue.commands.length = 0;
          self.queue.answers.length = 0;
        });

        it('should push commands to kTalk.queue.commands and return "Start playing URL..." string', function answers_play_tv_1() {
          expect(command.answer(command)).toBe('Start playing TV channel #123');
          expect(self.queue.commands.length).toBeGreaterThan(3);
          expect(self.queue.commands[0]).toBe('.stop');
          expect(self.queue.commands.slice(-1)[0]).toBe('.what\'s up');
        });

      });

      describe('play', function answers_play_0() {

        beforeEach(function () {
          command = cloneCommand('play');
          self.queue.commands.length = 0;
          self.queue.answers.length = 0;
        });

        it('should not push commands to kTalk.queue.commands and return "There is no active players." string', function answers_play_1() {
          command.response = [];
          expect(command.answer(command)).toBe('There is no active players.');
          expect(self.queue.commands.length).toBe(0);
        });

        it('should push commands to kTalk.queue.commands and return ["Audio playback [#]."] array', function answers_play_2() {
          command.response = [{
            playerid: 0,
            type: 'audio'
          }];
          expect(command.answer(command)).toEqual(['Audio playback [#].']);
          expect(self.queue.commands.length).toBe(2);
          expect(self.queue.commands[0]).toBe('.player.playpause 0 1');
          expect(self.queue.commands[1]).toBe('.answers.format "\\n"');
        });

        it('should push commands to kTalk.queue.commands and return ["Video playback [#]."] array', function answers_play_3() {
          command.response = [{
            playerid: 1,
            type: 'video'
          }];
          expect(command.answer(command)).toEqual(['Video playback [#].']);
          expect(self.queue.commands.length).toBe(2);
          expect(self.queue.commands[0]).toBe('.player.playpause 1 1');
          expect(self.queue.commands[1]).toBe('.answers.format "\\n"');
        });

        it('should push commands to kTalk.queue.commands and return ["Picture playback [#]."] array', function answers_play_4() {
          command.response = [{
            playerid: 2,
            type: 'picture'
          }];
          expect(command.answer(command)).toEqual(['Picture playback [#].']);
          expect(self.queue.commands.length).toBe(2);
          expect(self.queue.commands[0]).toBe('.player.playpause 2 1');
          expect(self.queue.commands[1]).toBe('.answers.format "\\n"');
        });

        it('should push commands to kTalk.queue.commands and return ["Audio playback [#].", "Picture playback [#]."] array', function answers_play_5() {
          command.response = [{
            "playerid": 0,
            "type": "audio"
          }, {
            "playerid": 2,
            "type": "picture"
          }];
          expect(command.answer(command)).toEqual(['Audio playback [#].', 'Picture playback [#].']);
          expect(self.queue.commands.length).toBe(3);
          expect(self.queue.commands[0]).toBe('.player.playpause 0 1');
          expect(self.queue.commands[1]).toBe('.player.playpause 2 1');
          expect(self.queue.commands[2]).toBe('.answers.format "\\n"');
        });

      });

      describe('pause', function answers_pause_0() {

        beforeEach(function () {
          command = cloneCommand('pause');
          self.queue.commands.length = 0;
          self.queue.answers.length = 0;
        });

        it('should not push commands to kTalk.queue.commands and return "There is no active players." string', function answers_pause_1() {
          command.response = [];
          expect(command.answer(command)).toBe('There is no active players.');
          expect(self.queue.commands.length).toBe(0);
        });

        it('should push commands to kTalk.queue.commands and return ["Audio playback [#]."] array', function answers_pause_2() {
          command.response = [{
            playerid: 0,
            type: 'audio'
          }];
          expect(command.answer(command)).toEqual(['Audio playback [#].']);
          expect(self.queue.commands.length).toBe(2);
          expect(self.queue.commands[0]).toBe('.player.playpause 0 0');
          expect(self.queue.commands[1]).toBe('.answers.format "\\n"');
        });

        it('should push commands to kTalk.queue.commands and return ["Video playback [#]."] array', function answers_pause_3() {
          command.response = [{
            playerid: 1,
            type: 'video'
          }];
          expect(command.answer(command)).toEqual(['Video playback [#].']);
          expect(self.queue.commands.length).toBe(2);
          expect(self.queue.commands[0]).toBe('.player.playpause 1 0');
          expect(self.queue.commands[1]).toBe('.answers.format "\\n"');
        });

        it('should push commands to kTalk.queue.commands and return ["Picture playback [#]."] array', function answers_pause_4() {
          command.response = [{
            playerid: 2,
            type: 'picture'
          }];
          expect(command.answer(command)).toEqual(['Picture playback [#].']);
          expect(self.queue.commands.length).toBe(2);
          expect(self.queue.commands[0]).toBe('.player.playpause 2 0');
          expect(self.queue.commands[1]).toBe('.answers.format "\\n"');
        });

        it('should push commands to kTalk.queue.commands and return ["Audio playback [#].", "Picture playback [#]."] array', function answers_pause_5() {
          command.response = [{
            "playerid": 0,
            "type": "audio"
          }, {
            "playerid": 2,
            "type": "picture"
          }];
          expect(command.answer(command)).toEqual(['Audio playback [#].', 'Picture playback [#].']);
          expect(self.queue.commands.length).toBe(3);
          expect(self.queue.commands[0]).toBe('.player.playpause 0 0');
          expect(self.queue.commands[1]).toBe('.player.playpause 2 0');
          expect(self.queue.commands[2]).toBe('.answers.format "\\n"');
        });

      });

      describe('stop', function answers_stop_0() {

        beforeEach(function () {
          command = cloneCommand('stop');
          self.queue.commands.length = 0;
          self.queue.answers.length = 0;
        });

        it('should not push commands to kTalk.queue.commands and return "There is no active players." string', function answers_stop_1() {
          command.response = [];
          expect(command.answer(command)).toBe('There is no active players.');
          expect(self.queue.commands.length).toBe(0);
        });

        it('should push commands to kTalk.queue.commands and return "Stopping 1 player" string', function answers_stop_2() {
          command.response = [{
            playerid: 0,
            type: 'audio'
          }];
          expect(command.answer(command)).toBe('Stopping 1 player');
          expect(self.queue.commands.length).toBe(1);
          expect(self.queue.commands[0]).toBe('.exec Player.Stop {"playerid":0}');
        });

        it('should push commands to kTalk.queue.commands and return "Stopping 2 players" string', function answers_stop_3() {
          command.response = [{
            "playerid": 0,
            "type": "audio"
          }, {
            "playerid": 2,
            "type": "picture"
          }];
          expect(command.answer(command)).toBe('Stopping 2 players');
          expect(self.queue.commands.length).toBe(2);
          expect(self.queue.commands[0]).toBe('.exec Player.Stop {"playerid":2}');
          expect(self.queue.commands[1]).toBe('.exec Player.Stop {"playerid":0}');
        });

      });

      describe('player.playpause', function answers_player_playpause_0() {

        beforeEach(function () {
          command = cloneCommand('player.playpause');
          self.queue.commands.length = 0;
          self.queue.answers.length = 0;
        });

        it('should return "paused" string', function answers_player_playpause_1() {
          command.response = {
            speed: 0
          };
          expect(command.answer(command)).toBe('paused');
          expect(self.queue.commands.length).toBe(0);
        });

        it('should return "resumed" string', function answers_player_playpause_2() {
          command.response = {
            speed: 1
          };
          expect(command.answer(command)).toBe('resumed');
          expect(self.queue.commands.length).toBe(0);
        });

      });

      describe('what\'s up', function answers_whatsup_0() {

        beforeEach(function () {
          command = cloneCommand('what\'s up');
          self.queue.commands.length = 0;
          self.queue.answers.length = 0;
        });

        it('should not push commands to kTalk.queue.commands if kTalk.queue.answers is empty and return "Nothing is playing now." string', function answers_whatsup_1() {
          command.response = [];
          expect(command.answer(command)).toBe('Nothing is playing now.');
          expect(self.queue.commands.length).toBe(0);
        });

        it('should push ".answers.join" command to kTalk.queue.commands if kTalk.queue.answers is not empty and return "Nothing is playing now." string', function answers_whatsup_2() {
          self.queue.answers = ['Previous response.'];
          command.response = [];
          expect(command.answer(command)).toBe('Nothing is playing now.');
          expect(self.queue.commands.length).toBe(1);
          expect(self.queue.commands[0]).toBe('.answers.join "\\n"');
        });

        it('should push commands to kTalk.queue.commands and return "Now playing:" string', function answers_whatsup_3() {
          command.response = [{
            playerid: 0,
            type: 'audio'
          }];
          expect(command.answer(command)).toBe('Now playing:');
          expect(self.queue.commands.length).toBe(2);
          expect(self.queue.commands[0]).toBe('.player.getitem 0');
          expect(self.queue.commands[1]).toBe('.answers.join "\\n"');
        });

        it('should push commands to kTalk.queue.commands and return "Now playing:" string', function answers_whatsup_4() {
          command.response = [{
            "playerid": 0,
            "type": "audio"
          }, {
            "playerid": 2,
            "type": "picture"
          }];
          expect(command.answer(command)).toBe('Now playing:');
          expect(self.queue.commands.length).toBe(3);
          expect(self.queue.commands[0]).toBe('.player.getitem 0');
          expect(self.queue.commands[1]).toBe('.player.getitem 2');
          expect(self.queue.commands[2]).toBe('.answers.join "\\n"');
        });

      });

      describe('player.getitem', function answers_player_getitem_0() {

        beforeEach(function () {
          command = cloneCommand('player.getitem');
          command.params = {
            playerid: 1,
            properties: ['artist', 'channeltype']
          };
        });

        it('should format a music track description', function answers_player_getitem_1() {
          command.params.playerid = 0;
          command.response = {
            "item": {
              "artist": ["Скрябін"],
              "id": 123,
              "label": "Нікому то не треба",
              "type": "song"
            }
          };
          expect(command.answer(command)).toBe('‣ Song: Скрябін — Нікому то не треба');
        });

        it('should format an audio description', function answers_player_getitem_2() {
          command.params.playerid = 0;
          command.response = {
            "item": {
              "artist": [],
              "id": 23,
              "label": "Don\'t Worry...",
              "type": ""
            }
          };
          expect(command.answer(command)).toBe('‣ Audio: Don\'t Worry...');
        });

        it('should format a movie description', function answers_player_getitem_3() {
          command.response = {
            "item": {
              "artist": [],
              "id": 12,
              "label": "American History X",
              "type": "movie"
            }
          };
          expect(command.answer(command)).toBe('‣ Movie: American History X');
        });

        it('should format a YouTube video description', function answers_player_getitem_4() {
          command.response = {
            "item": {
              "artist": ["Blender Foundation"],
              "label": "Big Buck Bunny",
              "type": "unknown"
            }
          };
          expect(command.answer(command)).toBe('‣ Video: Blender Foundation — Big Buck Bunny');
        });

        it('should format a TV channel description', function answers_player_getitem_5() {
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

        it('should format a photo description', function answers_player_getitem_6() {
          command.params.playerid = 2;
          command.response = {
            "item": {
              "label": "IMG_20010101_121007.jpg",
              "type": "picture"
            }
          };
          expect(command.answer(command)).toBe('‣ Picture: IMG_20010101_121007.jpg');
        });

        it('should format a picture description', function answers_player_getitem_7() {
          command.params.playerid = 2;
          command.response = {
            "item": {
              "label": "IMG_20010101_121115.jpg"
            }
          };
          expect(command.answer(command)).toBe('‣ Picture: IMG_20010101_121115.jpg');
        });

      });

      describe('tv', function answers_tv_0() {

        beforeEach(function () {
          command = cloneCommand('tv');
          command.message = 'tv';
          command.response = {
            "channels": [{
              channelid: 16,
              label: "Animal Planet"
            }, {
              channelid: 13,
              label: "FIDO"
            }, {
              channelid: 31,
              label: "TNT"
            }, {
              channelid: 36,
              label: "Pivot"
            }, {
              channelid: 58,
              label: "Reelz"
            }, {
              channelid: 25,
              label: "FXX"
            }, {
              channelid: 46,
              label: "Syfy"
            }, {
              channelid: 35,
              label: "Investigation Discovery"
            }, {
              channelid: 56,
              label: "American Heroes Channel"
            }, {
              channelid: 60,
              label: "BBC America"
            }, {
              channelid: 72,
              label: "MTV"
            }, {
              channelid: 32,
              label: "Logo TV"
            }, {
              channelid: 11,
              label: "Centric"
            }, {
              channelid: 71,
              label: "Comedy.tv"
            }, {
              channelid: 61,
              label: "Cooking Channel"
            }, {
              channelid: 1,
              label: "Universal HD"
            }, {
              channelid: 49,
              label: "AWE"
            }, {
              channelid: 15,
              label: "CMT"
            }, {
              channelid: 57,
              label: "Pop"
            }, {
              channelid: 52,
              label: "Adult Swim"
            }, {
              channelid: 41,
              label: "Spike"
            }, {
              channelid: 4,
              label: "DIY Network"
            }, {
              channelid: 53,
              label: "Lifetime"
            }, {
              channelid: 17,
              label: "TBS"
            }, {
              channelid: 34,
              label: "Travel Channel"
            }, {
              channelid: 40,
              label: "TLC"
            }, {
              channelid: 67,
              label: "LMN"
            }, {
              channelid: 26,
              label: "History"
            }, {
              channelid: 39,
              label: "Destination America"
            }, {
              channelid: 65,
              label: "Create"
            }, {
              channelid: 68,
              label: "Discovery Life"
            }, {
              channelid: 38,
              label: "Military History"
            }, {
              channelid: 48,
              label: "mydestination.tv"
            }, {
              channelid: 47,
              label: "National Geographic Channel"
            }, {
              channelid: 69,
              label: "Bravo"
            }, {
              channelid: 14,
              label: "Recipe.TV"
            }, {
              channelid: 44,
              label: "Nat Geo Wild"
            }, {
              channelid: 43,
              label: "MTV2"
            }, {
              channelid: 59,
              label: "Chiller"
            }, {
              channelid: 55,
              label: "Smithsonian Channel"
            }, {
              channelid: 70,
              label: "A&E"
            }, {
              channelid: 66,
              label: "Food Network"
            }, {
              channelid: 28,
              label: "Science"
            }, {
              channelid: 45,
              label: "Esquire Network"
            }, {
              channelid: 33,
              label: "AMC"
            }, {
              channelid: 74,
              label: "ASPiRE"
            }, {
              channelid: 10,
              label: "FYI"
            }, {
              channelid: 75,
              label: "Z Living"
            }, {
              channelid: 30,
              label: "Audience Network"
            }, {
              channelid: 37,
              label: "Crime & Investigation Network"
            }, {
              channelid: 73,
              label: "Cloo"
            }, {
              channelid: 64,
              label: "FX"
            }, {
              channelid: 18,
              label: "WE tv"
            }, {
              channelid: 7,
              label: "Lifetime Real Women"
            }, {
              channelid: 76,
              label: "El Rey Network"
            }, {
              channelid: 5,
              label: "Ovation"
            }, {
              channelid: 27,
              label: "E!"
            }, {
              channelid: 62,
              label: "Discovery Channel"
            }, {
              channelid: 8,
              label: "AXS TV"
            }, {
              channelid: 51,
              label: "USA Network"
            }, {
              channelid: 63,
              label: "TV One"
            }, {
              channelid: 20,
              label: "Pets.TV"
            }, {
              channelid: 21,
              label: "Comedy Central"
            }, {
              channelid: 9,
              label: "OWN"
            }, {
              channelid: 19,
              label: "GSN"
            }, {
              channelid: 3,
              label: "VH1"
            }, {
              channelid: 2,
              label: "Ion Life"
            }, {
              channelid: 42,
              label: "RLTV"
            }, {
              channelid: 22,
              label: "Oxygen"
            }, {
              channelid: 50,
              label: "BET"
            }, {
              channelid: 12,
              label: "truTV"
            }, {
              channelid: 54,
              label: "Viceland"
            }, {
              channelid: 6,
              label: "WGN America"
            }, {
              channelid: 23,
              label: "Es.tv"
            }, {
              channelid: 24,
              label: "HGTV"
            }, {
              channelid: 29,
              label: "VH1 Classic"
            }],
            "limits": {
              "end": 76,
              "start": 0,
              "total": 76
            }
          };
        });

        it('should return the list of all TV channels', function answers_tv_1() {
          var answer = command.answer(command);

          expect(answer).toEqual(jasmine.any(String));
          expect(answer).toMatch(/^(?:\[\[\d{1,2}\|\|play tv \d{1,2}\]\]: .*\n){75}\[\[\d{1,2}\|\|play tv \d{1,2}\]\]: .*$/);
        });

        it('should return the sorted by label list of TV channels', function answers_tv_2() {
          var answer = command.answer(command);

          expect(answer).toEqual(jasmine.any(String));
          expect(answer).toMatch(/^\[\[70\|\|.*\n\[\[52\|\|.*\n\[\[33\|\|.*\n[\s\S]+?\[\[18\|\|.*\n\[\[6\|\|.*\n\[\[75\|\|.*$/);
        });

        it('should return the sorted by number list of TV channels', function answers_tv_3() {
          var answer;

          command.message = 'tv#';
          answer = command.answer(command);

          expect(answer).toEqual(jasmine.any(String));
          expect(answer).toMatch(/^\[\[1\|\|.*\n\[\[2\|\|.*\n\[\[3\|\|.*\n[\s\S]+?\[\[74\|\|.*\n\[\[75\|\|.*\n\[\[76\|\|.*$/);
        });

        it('should return the sorted by label list of TV channels whose label contains "dis"', function answers_tv_4() {
          var answer;

          command.message = 'tv dis';
          answer = command.answer(command);

          expect(answer).toBe('[[62||play tv 62]]: Discovery Channel\n[[68||play tv 68]]: Discovery Life\n[[35||play tv 35]]: Investigation Discovery');
        });

        it('should return the sorted by number list of TV channels whose label contains "dis"', function answers_tv_5() {
          var answer;

          command.message = 'tv# dis';
          answer = command.answer(command);

          expect(answer).toBe('[[35||play tv 35]]: Investigation Discovery\n[[62||play tv 62]]: Discovery Channel\n[[68||play tv 68]]: Discovery Life');
        });

      });

      describe('fullscreen', function answers_fullscreen_0() {

        beforeEach(function () {
          command = cloneCommand('fullscreen');
        });

        it('should return "OK, fullscreen mode activated." string if command.response is true', function answers_fullscreen_1() {
          command.response = true;
          expect(command.answer(command)).toBe('OK, fullscreen mode activated.');
        });

        it('should return "Oops, still in GUI mode." string if command.response is false', function answers_fullscreen_2() {
          command.response = false;
          expect(command.answer(command)).toBe('Oops, still in GUI mode.');
        });

      });

      describe('sleep', function answers_sleep_0() {

        beforeEach(function () {
          command = cloneCommand('sleep');
          command.message = 'sleep 0';
          command.response = {
            "addons": [{
              "addonid": "script.sleep",
              "type": "xbmc.python.script"
            }, {
              "addonid": "service.openelec.settings",
              "type": "xbmc.python.script"
            }, {
              "addonid": "script.module.youtube.dl",
              "type": "xbmc.python.script"
            }],
            "limits": {
              "end": 3,
              "start": 0,
              "total": 3
            }
          };
          self.queue.commands.length = 0;
          self.queue.answers.length = 0;
        });

        it('should return rejected promise with "The required "Sleep" addon by robwebset is not installed." value', function answers_sleep_1(done) {
          command.response.addons.shift();
          command.answer(command).then(function () {
            done.fail('Promise should not be resolved');
          }, function (v) {
            expect(v).toBe('The required "Sleep" addon by robwebset is not installed.');
            done();
          });
        });

        it('should push commands to kTalk.queue.commands to disable sleep timer', function answers_sleep_2() {
          expect(command.answer(command)).toBeUndefined();
          expect(self.queue.commands.length).toBe(13);
          expect(self.queue.commands[0]).toBe('.exec Addons.ExecuteAddon {"addonid":"script.sleep"}');
          expect(self.queue.commands[1]).toBe('.delay 1500');
          expect(self.queue.commands[2]).toBe('.exec Input.Left {}');
          expect(self.queue.commands[3]).toBe('.exec Input.Select {}');
          expect(self.queue.commands[4]).toBe('.exec Input.Select {}');
          expect(self.queue.commands[8]).toBe('.exec Input.Select {}');
          expect(self.queue.commands[9]).toBe('.exec Input.Select {}');
          expect(self.queue.commands[10]).toBe('.delay 1500');
          expect(self.queue.commands[11]).toBe('.exec Input.Back {}');
          expect(self.queue.commands[12]).toBe('.echo Sleep timer is disabled.');
        });

        it('should push commands to kTalk.queue.commands to set sleep timer for 10 minutes.', function answers_sleep_3() {
          command.message = 'sleep 7';
          expect(command.answer(command)).toBeUndefined();
          expect(self.queue.commands.length).toBe(15);
          expect(self.queue.commands[0]).toBe('.exec Addons.ExecuteAddon {"addonid":"script.sleep"}');
          expect(self.queue.commands[1]).toBe('.delay 1500');
          expect(self.queue.commands[2]).toBe('.exec Input.Left {}');
          expect(self.queue.commands[3]).toBe('.exec Input.Select {}');
          expect(self.queue.commands[4]).toBe('.exec Input.Select {}');
          expect(self.queue.commands[8]).toBe('.exec Input.Select {}');
          expect(self.queue.commands[9]).toBe('.exec Input.Select {}');
          expect(self.queue.commands[10]).toBe('.exec Input.Right {}');
          expect(self.queue.commands[11]).toBe('.exec Input.Select {}');
          expect(self.queue.commands[12]).toBe('.delay 1500');
          expect(self.queue.commands[13]).toBe('.exec Input.Back {}');
          expect(self.queue.commands[14]).toBe('.echo Sleep timer is set for 10 minutes.');
        });

        it('should push commands to kTalk.queue.commands to set sleep timer for 30 minutes.', function answers_sleep_4() {
          command.message = 'sleep 34';
          expect(command.answer(command)).toBeUndefined();
          expect(self.queue.commands.length).toBe(17);
          expect(self.queue.commands[0]).toBe('.exec Addons.ExecuteAddon {"addonid":"script.sleep"}');
          expect(self.queue.commands[1]).toBe('.delay 1500');
          expect(self.queue.commands[2]).toBe('.exec Input.Left {}');
          expect(self.queue.commands[3]).toBe('.exec Input.Select {}');
          expect(self.queue.commands[4]).toBe('.exec Input.Select {}');
          expect(self.queue.commands[8]).toBe('.exec Input.Select {}');
          expect(self.queue.commands[9]).toBe('.exec Input.Select {}');
          expect(self.queue.commands[10]).toBe('.exec Input.Right {}');
          expect(self.queue.commands[11]).toBe('.exec Input.Select {}');
          expect(self.queue.commands[12]).toBe('.exec Input.Select {}');
          expect(self.queue.commands[13]).toBe('.exec Input.Select {}');
          expect(self.queue.commands[14]).toBe('.delay 1500');
          expect(self.queue.commands[15]).toBe('.exec Input.Back {}');
          expect(self.queue.commands[16]).toBe('.echo Sleep timer is set for 30 minutes.');
        });

        it('should push commands to kTalk.queue.commands to set sleep timer for 1 hour.', function answers_sleep_5() {
          command.message = 'sleep 123';
          expect(command.answer(command)).toBeUndefined();
          expect(self.queue.commands.length).toBe(20);
          expect(self.queue.commands[0]).toBe('.exec Addons.ExecuteAddon {"addonid":"script.sleep"}');
          expect(self.queue.commands[1]).toBe('.delay 1500');
          expect(self.queue.commands[2]).toBe('.exec Input.Left {}');
          expect(self.queue.commands[3]).toBe('.exec Input.Select {}');
          expect(self.queue.commands[4]).toBe('.exec Input.Select {}');
          expect(self.queue.commands[8]).toBe('.exec Input.Select {}');
          expect(self.queue.commands[9]).toBe('.exec Input.Select {}');
          expect(self.queue.commands[10]).toBe('.exec Input.Right {}');
          expect(self.queue.commands[11]).toBe('.exec Input.Select {}');
          expect(self.queue.commands[12]).toBe('.exec Input.Select {}');
          expect(self.queue.commands[15]).toBe('.exec Input.Select {}');
          expect(self.queue.commands[16]).toBe('.exec Input.Select {}');
          expect(self.queue.commands[17]).toBe('.delay 1500');
          expect(self.queue.commands[18]).toBe('.exec Input.Back {}');
          expect(self.queue.commands[19]).toBe('.echo Sleep timer is set for 1 hour.');
        });

      });

      describe('version', function answers_version_0() {

        beforeEach(function () {
          command = cloneCommand('version');
          self.queue.commands.length = 0;
          self.queue.answers.length = 0;
        });

        it('should push commands to kTalk.queue.commands', function answers_version_1() {
          expect(command.answer(command)).toBeUndefined();
          expect(self.queue.commands.length).toBe(3);
          expect(self.queue.commands[0]).toBe('.version.addon plugin.webinterface.ktalk');
          expect(self.queue.commands[1]).toBe('.version.kodi');
          expect(self.queue.commands[2]).toBe('.answers.join "\\n"');
        });

      });

      describe('version.kodi', function answers_version_kodi_0() {

        beforeEach(function () {
          command = cloneCommand('version.kodi');
          command.response = {
            name: 'Kodi',
            version: {
              major: 15,
              minor: 2,
              tag: 'stable',
              tagversion: '',
              revision: '02e7013'
            }
          };
        });

        it('should format a Kodi version if it is a stable release', function answers_version_kodi_1() {
          expect(command.answer(command)).toBe('Kodi version is 15.2 (rev. 02e7013).');
        });

        it('should format a Kodi version if it is a release candidate', function answers_version_kodi_2() {
          command.response.version.tag = 'releasecandidate';
          command.response.version.tagversion = '1';
          command.response.version.revision = '59716ca';

          expect(command.answer(command)).toBe('Kodi version is 15.2 RC 1 (rev. 59716ca).');
        });

        it('should format a Kodi version if it is a beta release', function answers_version_kodi_3() {
          command.response.version.major = 16;
          command.response.version.minor = 0;
          command.response.version.tag = 'beta';
          command.response.version.tagversion = '4';
          command.response.version.revision = 'a724f29';

          expect(command.answer(command)).toBe('Kodi version is 16.0 Beta 4 (rev. a724f29).');
        });

        it('should format a Kodi version if it is a alpha release', function answers_version_kodi_4() {
          command.response.version.major = 16;
          command.response.version.minor = 0;
          command.response.version.tag = 'alpha';
          command.response.version.tagversion = '2';
          command.response.version.revision = 'b4afc20';

          expect(command.answer(command)).toBe('Kodi version is 16.0 Alpha 2 (rev. b4afc20).');
        });

        it('should format a Kodi version if it is a prealpha release', function answers_version_kodi_5() {
          command.response.version.major = 13;
          command.response.version.minor = 0;
          command.response.version.tag = 'prealpha';
          command.response.version.tagversion = '11';
          command.response.version.revision = '8eb49b3';

          expect(command.answer(command)).toBe('Kodi version is 13.0 Prealpha 11 (rev. 8eb49b3).');
        });

      });

      describe('version.addon', function answers_version_addon_0() {

        beforeEach(function () {
          command = cloneCommand('version.addon');
          command.response = {
            addon: {
              addonid: 'plugin.webinterface.ktalk',
              name: 'Kodi Talk',
              type: 'xbmc.webinterface',
              version: '0.2.3'
            }
          };
        });

        it('should format a given addon name and version', function answers_version_addon_1() {
          command.response.addon.addonid = 'plugin.video.youtube';
          command.response.addon.name = 'YouTube';
          command.response.addon.type = 'xbmc.python.pluginsource';
          command.response.addon.version = '5.2.1';

          expect(command.answer(command)).toBe('YouTube addon version is 5.2.1.');
        });

        it('should return "My version is..." if the addon is Kodi Talk', function answers_version_addon_2() {
          expect(command.answer(command)).toBe('My version is 0.2.3.');
        });

      });

      describe('delay', function answers_delay_0() {
        var spy;

        beforeEach(function () {
          jasmine.clock().install();
          spy = jasmine.createSpy("After Delay");
          command = cloneCommand('delay');
          command.message = 'delay 50';
        });

        afterEach(function () {
          jasmine.clock().uninstall();
        });

        it('should return promise resolved after given time with "Waiting ### ms." result', function answers_delay_1(done) {
          command.answer(command).then(function (v) {
            spy();
            expect(v).toBe('Waiting 50 ms.');
          }, function () {
            done.fail('Promise should not be rejected');
          });
          checkSpyDelayedCall(50, spy, done);
        });

        it("should limit delay to 10 s", function answers_delay_2(done) {
          command.message = 'delay 90000';

          command.answer(command).then(function (v) {
            spy();
            expect(v).toBe('Waiting 10000 ms.');
          }, function () {
            done.fail('Promise should not be rejected');
          });
          checkSpyDelayedCall(10000, spy, done);
        });

      });

      describe('answers.clear', function answers_answers_clear_0() {

        beforeEach(function () {
          command = cloneCommand('answers.clear');
          self.queue.answers = ['One', 'Two', 'Three', 'Four'];
        });

        it('should clear kTalk.queue.answers and return an empty string', function answers_answers_clear_1() {
          expect(self.queue.answers.length).toBeGreaterThan(0);
          expect(command.answer(command)).toBe('');
          expect(self.queue.answers.length).toBe(0);
        });

      });

      describe('answers.join', function answers_answers_join_0() {

        beforeEach(function () {
          command = cloneCommand('answers.join');
          self.queue.answers = ['Answer one', 'Answer two', 'Answer three', 'Answer four'];
        });

        it('should return the string of kTalk.queue.answers values divided with space', function answers_answers_join_1() {
          command.message = 'answers.join " "';
          
          expect(self.queue.answers.length).toBeGreaterThan(0);
          expect(command.answer(command)).toBe('Answer one Answer two Answer three Answer four');
          expect(self.queue.answers.length).toBe(0);
        });

        it('should return the string of kTalk.queue.answers values divided with comma', function answers_answers_join_2() {
          command.message = 'answers.join , ';
          
          expect(self.queue.answers.length).toBeGreaterThan(0);
          expect(command.answer(command)).toBe('Answer one, Answer two, Answer three, Answer four');
          expect(self.queue.answers.length).toBe(0);
        });

        it('should return the string of kTalk.queue.answers values as lines', function answers_answers_join_3() {
          command.message = 'answers.join "\\n"';
          
          expect(self.queue.answers.length).toBeGreaterThan(0);
          expect(command.answer(command)).toBe('Answer one\nAnswer two\nAnswer three\nAnswer four');
          expect(self.queue.answers.length).toBe(0);
        });

        it('should process "\u2408" (BS) symbol by deleting it and leftward symbol', function answers_answers_join_4() {
          self.queue.answers.push('\u2408...');
          command.message = 'answers.join "\\n"';
          
          expect(self.queue.answers.length).toBeGreaterThan(0);
          expect(command.answer(command)).toBe('Answer one\nAnswer two\nAnswer three\nAnswer four...');
          expect(self.queue.answers.length).toBe(0);
        });

        it('should process successive "\u2408" (BS) symbols', function answers_answers_join_5() {
          self.queue.answers.push('\u2408...ZZZZ\u2408\u2408\u2408\u2408');
          command.message = 'answers.join "\\n"';
          
          expect(self.queue.answers.length).toBeGreaterThan(0);
          expect(command.answer(command)).toBe('Answer one\nAnswer two\nAnswer three\nAnswer four...');
          expect(self.queue.answers.length).toBe(0);
        });

      });

      describe('answers.format', function answers_answers_format_0() {

        beforeEach(function () {
          command = cloneCommand('answers.format');
          self.queue.answers = [['Player 1 is: "[#]"', 'Player 2 is: "[#]"', 'Player 3 is: "[#]"'], 'Audio', 'Video', 'Photo'];
        });

        it('should return the string of formatted kTalk.queue.answers values when format value is a string', function answers_answers_format_1() {
          command.message = 'answers.format " "';
          self.queue.answers = ['Player 1 is: "[#]"; Player 2 is: "[#]"; Player 3 is: "[#]"', 'Audio', 'Video', 'Photo'];
          
          expect(self.queue.answers.length).toBeGreaterThan(0);
          expect(command.answer(command)).toBe('Player 1 is: "Audio"; Player 2 is: "Video"; Player 3 is: "Photo"');
          expect(self.queue.answers.length).toBe(0);
        });

        it('should return the string of formatted kTalk.queue.answers values divided with space when format value is an array', function answers_answers_format_2() {
          command.message = 'answers.format " "';
          
          expect(self.queue.answers.length).toBeGreaterThan(0);
          expect(command.answer(command)).toBe('Player 1 is: "Audio" Player 2 is: "Video" Player 3 is: "Photo"');
          expect(self.queue.answers.length).toBe(0);
        });

        it('should return the string of formatted kTalk.queue.answers values divided with comma', function answers_answers_format_3() {
          command.message = 'answers.format , ';
          
          expect(self.queue.answers.length).toBeGreaterThan(0);
          expect(command.answer(command)).toBe('Player 1 is: "Audio", Player 2 is: "Video", Player 3 is: "Photo"');
          expect(self.queue.answers.length).toBe(0);
        });

        it('should return the string of formatted kTalk.queue.answers values as lines', function answers_answers_format_4() {
          command.message = 'answers.format "\\n"';
          
          expect(self.queue.answers.length).toBeGreaterThan(0);
          expect(command.answer(command)).toBe('Player 1 is: "Audio"\nPlayer 2 is: "Video"\nPlayer 3 is: "Photo"');
          expect(self.queue.answers.length).toBe(0);
        });

        it('should process "\u2408" (BS) symbol by deleting it and leftward symbol', function answers_answers_format_5() {
          self.queue.answers[0].push('\u2408...');
          command.message = 'answers.format "\\n"';
          
          expect(self.queue.answers.length).toBeGreaterThan(0);
          expect(command.answer(command)).toBe('Player 1 is: "Audio"\nPlayer 2 is: "Video"\nPlayer 3 is: "Photo"...');
          expect(self.queue.answers.length).toBe(0);
        });

        it('should process successive "\u2408" (BS) symbols', function answers_answers_format_6() {
          self.queue.answers[0].push('\u2408...ZZZZ\u2408\u2408\u2408\u2408');
          command.message = 'answers.format "\\n"';
          
          expect(self.queue.answers.length).toBeGreaterThan(0);
          expect(command.answer(command)).toBe('Player 1 is: "Audio"\nPlayer 2 is: "Video"\nPlayer 3 is: "Photo"...');
          expect(self.queue.answers.length).toBe(0);
        });

      });

      describe('debug', function answers_debug_0() {

        beforeEach(function () {
          command = cloneCommand('debug');
        });

        it('should return the result of evaluation of the string expression', function answers_debug_1() {
          command.message = 'debug typeof window.kTalk';
          expect(command.answer(command)).toBe('# typeof window.kTalk =\n"object"');

          command.message = 'debug document.title';
          expect(command.answer(command)).toBe('# document.title =\n"Kodi Talk Tests"');
        });

      });

    });

  });

});
