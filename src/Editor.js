export default class Editor {
  constructor() {
    this.handlers = {};

    this.el = document.createElement('textarea');
    this.el.style['position'] = 'absolute';
    this.el.style['left'] = '-10000px';
    this.el.style['overflow'] = 'hidden';
    this.el.style['border-color'] = '#3691FF';
    this.el.style['outline'] = 'none';
    this.el.style['z-index'] = '4';
    this.el.style['display'] = 'block';

    // Listen keyboard event
    this.el.addEventListener('keydown', (evt) => {
      if (evt.key === 'Enter' && evt.target == this.el) { // Enter key event
        let handler = this.handlers['hide'];
        handler && handler(evt);
      } else {
        let handler = this.handlers['show'];
        handler && handler(evt);
      }
    }, false);
    // Listen input event
    this.el.addEventListener('input', (evt) => {
      this.updateHeight();
      let handler = this.handlers['input'];
      handler && handler(evt, this.el.value);
    });
  }

  // event supports 'hide', 'show', 'input'
  on(event, callback = undefined) {
    this.handlers[event] = callback;
  }

  // event supports 'hide', 'show', 'input'
  remove(event) {
    this.handlers[event] = undefined;
  }

  prepare(x, y) {
    this.el.focus();
    this.el.style['left'] = `${x}px`;
    this.el.style['top'] = `${y}px`;
    
    setTimeout(() => {
      this.updateHeight();
    }, 10);
  }

  show(value, width, rect) {
    this.el.value = value || '';
    this.el.style['left'] = `${rect.left}px`;
    this.el.style['top'] = `${rect.top}px`;
    this.el.style['width'] = `${rect.right - rect.left}px`;
    this.el.style['height'] = `${rect.bottom - rect.top}px`;
    this.el.style['z-index'] = '6';
    this.el.style['min-width'] = `${Math.max(rect.right - rect.left, width, 100)}px`;
    this.el.style['min-height'] = `${rect.bottom - rect.top}px`;
    this.el.style['max-height'] = `${this.canvasHeight > 100 ? this.canvasHeight : 100}px`;
  }

  hide() {
    this.el.style['z-index'] = '4';
  }

  update(x, y) {
    this.el.focus();
    this.el.style['z-index'] = '6';
    this.el.style['left'] = `${x}px`;
    this.el.style['top'] = `${y}px`;
  }

  updateHeight() {
    let scrollHeight = this.el.scrollHeight;
    let maxHeight = this.canvasHeight > 100 ? this.canvasHeight : 100;
    this.el.style['height'] = `${scrollHeight}px`;
    if (scrollHeight > maxHeight) {
      this.el.style['overflow'] = 'auto';
    }
  }
}