/*global Promise: false*/
(function () {
  'use strict';

  function callMethod(params) {

    function makeRequest(b) {
      return {
        method: "POST",
        body: JSON.stringify({
          id: b.id || 1,
          jsonrpc: b.jsonrpc || '2.0',
          method: b.method || 'JSONRPC.Ping',
          params: b.params || {}
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

    function parseResult(r) {
      if (!r.error) {
        return Promise.resolve(r.result);
      }
      return Promise.reject(r.error);
    }

    return window.fetch(window.kodi.url, makeRequest(params))
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
