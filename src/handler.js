
function getAddEventListener() {
  return window.addEventListener ? 'addEventListener' : 'attachEvent';
}

function getEventName(eventName) {
  return window.addEventListener ? eventName : 'on' + eventName;
}

/**
 * wheel event listener for all browser
 */
const addWheelListener = function (window, document) {
  let support;
  let _addEventListener = getAddEventListener();

  // detect available wheel event
  support =
    'onwheel' in document.createElement('div')
      ? 'wheel' // 各个厂商的高版本浏览器都支持"wheel"
      : document.onmousewheel !== undefined
      ? 'mousewheel' // Webkit 和 IE 一定支持"mousewheel"
      : 'DOMMouseScroll'; // 低版本 firefox

  function _addWheelListener(elem, eventName, callback, useCapture) {
    elem[_addEventListener](
      getEventName(eventName),
      support == 'wheel'
        ? callback
        : function (originalEvent) {
            !originalEvent && (originalEvent = window.event);

            // create a normalized event object
            var event = {
              // keep a ref to the original event object
              originalEvent: originalEvent,
              target: originalEvent.target || originalEvent.srcElement,
              type: 'wheel',
              deltaMode: originalEvent.type == 'MozMousePixelScroll' ? 0 : 1,
              deltaX: 0,
              deltaZ: 0,
              preventDefault: function () {
                originalEvent.preventDefault ? originalEvent.preventDefault() : (originalEvent.returnValue = false);
              },
            };

            // calculate deltaY (and deltaX) according to the event
            if (support == 'mousewheel') {
              event.deltaY = (-1 / 40) * originalEvent.wheelDelta;
              // Webkit also support wheelDeltaX
              originalEvent.wheelDeltaX && (event.deltaX = (-1 / 40) * originalEvent.wheelDeltaX);
            } else {
              event.deltaY = originalEvent.detail;
            }

            // it's time to fire the callback
            return callback(event);
          },
      useCapture || false
    );
  }

  return function (elem, callback, useCapture) {
    _addWheelListener(elem, support, callback, useCapture);

    // handle MozMousePixelScroll in older Firefox
    if (support == 'DOMMouseScroll') {
      _addWheelListener(elem, 'MozMousePixelScroll', callback, useCapture);
    }
  };
}(window, document);


/**
 * Touchevent handler
 */
function addMoveListener(target, callback) {
  let lastX = null;
  let lastY = null;

  let _addEventListener = getAddEventListener();
  
  function _watch(elem, eventName, callback, useCapture) {
    elem[_addEventListener](
      getEventName(eventName),
      callback,
      useCapture || false
    );
  }

  const handleStart = function(e) {
    lastX = e.offsetX || e.touches[0].clientX;
    lastY = e.offsetY || e.touches[0].clientY;
  };
  const handleMove = function(e) {
    if (lastX === null || lastY === null) {
      return;
    }
    let x = e.offsetX || e.touches[0].clientX;
    let y = e.offsetY || e.touches[0].clientY;
    e.deltaX = lastX - x;
    e.deltaY = lastY - y;
    lastX = x;
    lastY = y;
    callback(e);
  };
  const handleEnd = function(e) {
    lastX = null;
    lastY = null;
  };
  _watch(target, 'mousedown', handleStart);
  _watch(target, 'mousemove', handleMove);
  _watch(target, 'mouseup', handleEnd);
  _watch(target, 'mouseout', handleEnd);

  if ('ontouchstart' in document.documentElement) {
    console.log('touch');
    _watch(target, 'touchstart', handleStart);
    _watch(target, 'touchmove', handleMove);
    _watch(target, 'touchend', handleEnd);
    _watch(target, 'touchcancel', handleEnd);
  }
}



export default class EventHandler {
  constructor() {
  }

  register(target, onPointerMove) {
    if (!target) return;

    addWheelListener(target, (event) => {
      onPointerMove && onPointerMove(event, event.deltaX, event.deltaY);
    });

    addMoveListener(target, (event) => {
      onPointerMove && onPointerMove(event, event.deltaX, event.deltaY);
    });
  }
}
