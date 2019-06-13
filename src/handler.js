export default class PointerEventHandler {
  constructor() {
    this.pointerType = 'touch';
    this.lastPointerX = null;
    this.lastPointerY = null;
  }

  register(target, onPointerDown, onPointerMove, onPointerUp) {
    if (!target) return;
    target.addEventListener('pointerdown', (evt) => {
      if (evt.pointerType === this.pointerType) {
        this.lastPointerX = evt.x;
        this.lastPointerY = evt.y;
        onPointerDown && onPointerDown(evt);
      }
    });
    target.addEventListener('pointermove', (evt) => {
      if (evt.pointerType === this.pointerType) {
        let deltaX = this.lastPointerX - evt.x;
        let deltaY = this.lastPointerY - evt.y;
        this.lastPointerX = evt.x;
        this.lastPointerY = evt.y;
        onPointerMove && onPointerMove(evt, deltaX, deltaY);
      }
    });
    target.addEventListener('pointerup', (evt) => {
      if (evt.pointerType === this.pointerType) {
        let deltaX = this.lastPointerX - evt.x;
        let deltaY = this.lastPointerY - evt.y;
        this.lastPointerX = null;
        this.lastPointerY = null;
        onPointerUp && onPointerUp(evt, deltaX, deltaY);
      }
    });
  }

  isHandling() {
    return (this.lastPointerX != null || this.lastPointerY != null);
  }
}

/*
export class StageMouseEventHandler {
  constructor() {
    this.pointerType = 'touch';
    this.lastPointerX = null;
    this.lastPointerY = null;
  }

  register(target) {
    if (!target) return;
    // Drag by mouse press
    // stage.on('stagemousedown', (evt) => {
    //   this.stageMovable = true;
    //   this.lastX = evt.localX;
    //   this.lastY = evt.localY;
    // });
    // stage.on('stagemouseup', (evt) => {
    //   this.stageMovable = false;
    //   this.lastX = evt.localX;
    //   this.lastY = evt.localY;
    // });
    // stage.on('stagemousemove', (evt) => {
    //   // 拖动方向与滚动方向相同
    //   let deltaX = this.lastX - evt.localX;
    //   let deltaY = this.lastY - evt.localY;
    //   this.lastX = evt.localX;
    //   this.lastY = evt.localY;
    //   if (!this.stageMovable) return;
    //   this.updateScrollX(deltaX);
    //   this.updateScrollY(deltaY);
    //   this.render();
    // });
  }
}
*/