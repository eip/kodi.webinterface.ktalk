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

  function parseResult(obj) {
    return new Promise(function (resolve, reject) {
      if (obj.error) {
        // console.warn('Error!');
        reject(obj.error);
      } else {
        // console.log('Success!');
        resolve(obj.result);
      }
    });
  }

  function callMethod(method, params) {
    // console.log('Calling ' + method);
    return window.fetch(window.kodi.url, {
      method: "POST",
      body: JSON.stringify({
        "id": 1,
        "jsonrpc": "2.0",
        "method": method,
        "params": params
      }),
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "same-origin"
    }).then(function (response) {
      // console.log(response.statusText);
      return response.json();
    }).then(parseResult);
  }

  window.kodi = window.kodi || {};
  window.kodi.url = '/jsonrpc';
  if (window.location.protocol.indexOf('http') === -1) {
    window.kodi.url = 'http://192.168.237.9:8080' + window.kodi.url;
    window.console.warn('Using test server: ' + window.kodi.url);
  }
  window.kodi.call = callMethod;

  //  window.kodi.call("JSONRPC.Ping", {});
  //  window.kodi.call("JSONRPC.Invalid", {}).then(function (r) {
  //    console.log(r);
  //  }, function (e) {
  //    console.warn(e);
  //  });  

  window.console.info('Kodi initialized');
}());
