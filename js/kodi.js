/*global Promise: false*/
(function () {
  'use strict';

  function transformUri(uri) {
    uri = uri.trim();
    var match = /^https?:\/\/(?:www\.)?youtu(?:\.be|be\.com)\/(?:\S+\/)?(?:[^\s\/]*(?:\?|&)vi?=)?([^#?&]+)/i.exec(uri);
    if (match) {
      return 'plugin://plugin.video.youtube/?path=/root&search&action=play_video&videoid=' + match[1];
    }
    return uri;
  }

  function callMethod(request) {

    function formatRequest(r) {
      return {
        method: "POST",
        body: JSON.stringify({
          id: r.id || 1,
          jsonrpc: r.jsonrpc || '2.0',
          method: r.method || 'JSONRPC.Ping',
          params: r.params || {}
        }),
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "same-origin"
      };
    }

    function toJson(r) {
      return r.json();
    }

    function parseResult(obj) {
      if (!obj.error) {
        return Promise.resolve(obj.result);
      }
      return Promise.reject(obj.error);
    }

    return window.fetch(window.kodi.url, formatRequest(request))
      .then(toJson)
      .then(parseResult);
  }

  window.kodi = window.kodi || {};
  window.kodi.url = '/jsonrpc';
  if (window.location.protocol.indexOf('http') === -1) {
    window.kodi.url = 'http://192.168.237.9:8080' + window.kodi.url;
    window.console.warn('Using test server: ' + window.kodi.url);
  }
  window.kodi.call = callMethod;
  window.console.info('Kodi initialized');
}());
