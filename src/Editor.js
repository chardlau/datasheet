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

  updateHeight() {
    let scrollHeight = this.el.scrollHeight;
    let maxHeight = this.canvasHeight > 100 ? this.canvasHeight : 100;
    this.el.style['height'] = `${scrollHeight}px`;
    if (scrollHeight > maxHeight) {
      this.el.style['overflow'] = 'auto';
    }
  }

  prepare(value, x, y, width, height, minHeight) {
    this.el.focus();
    this.el.value = value || '';
    this.el.style['z-index'] = '6';
    this.el.style['left'] = `${x}px`;
    this.el.style['top'] = `${y}px`;
    this.el.style['width'] = `${width}px`;
    this.el.style['height'] = `${height}px`;
    this.el.style['min-height'] = `${minHeight}px`;
    this.el.style['max-height'] = `${this.canvasHeight > 100 ? this.canvasHeight : 100}px`;
    setTimeout(() => {
      this.updateHeight();
    }, 10);
  }

  show(value) {
    this.el.value = value || '';
    this.el.style['z-index'] = '6';
  }

  hide() {
    this.el.style['z-index'] = '-1000';
  }

  update(x, y, width) {
    this.el.focus();
    this.el.style['z-index'] = '6';
    this.el.style['left'] = `${x}px`;
    this.el.style['top'] = `${y}px`;
    this.el.style['width'] = `${width}px`;
  }
}