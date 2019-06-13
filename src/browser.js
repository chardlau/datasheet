/**
 * Browser tester
 */
const tester = function tester(testerFunc) {
  let result = {
    value: false
  };

  result.test = function (ua, vendor) {
    result.value = testerFunc(ua, vendor);
  };

  return result;
};
const browsers = {
  chrome: tester(function (ua, vendor) {
    return /Chrome/.test(ua) && /Google/.test(vendor);
  }),
  edge: tester(function (ua) {
    return /Edge/.test(ua);
  }),
  ie: tester(function (ua) {
    return /Trident/.test(ua);
  }),
  // eslint-disable-next-line no-restricted-globals
  ie8: tester(function () {
    return !document.createTextNode('test').textContent;
  }),
  // eslint-disable-next-line no-restricted-globals
  ie9: tester(function () {
    return !!document.documentMode;
  }),
  mobile: tester(function (ua) {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  }),
  safari: tester(function (ua, vendor) {
    return /Safari/.test(ua) && /Apple Computer/.test(vendor);
  })
};

function setBrowserMeta() {
  Object.keys(browsers).forEach(key => {
    browsers[key].test(navigator.userAgent, navigator.vendor);
  });
}

setBrowserMeta();

export function isChrome() {
  return browsers.chrome.value;
}

export function isEdge() {
  return browsers.edge.value;
}

export function isIE() {
  return browsers.ie.value;
}

export function isIE8() {
  return browsers.ie8.value;
}

export function isIE9() {
  return browsers.ie9.value;
}

export function isMSBrowser() {
  return browsers.ie.value || browsers.edge.value;
}

export function isMobileBrowser() {
  return browsers.mobile.value;
}

export function isSafari() {
  return browsers.safari.value;
}