/*!
* DataSheet
* A table component base on CreateJs/EaselJS for displaying large
* scale number of data on web page.
*
* Copyright (c) 2019 chardlau.com<chardlau@outlook.com>.
*
* Permission is hereby granted, free of charge, to any person
* obtaining a copy of this software and associated documentation
* files (the "Software"), to deal in the Software without
* restriction, including without limitation the rights to use,
* copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the
* Software is furnished to do so, subject to the following
* conditions:
*
* The above copyright notice and this permission notice shall be
* included in all copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
* EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
* OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
* NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
* HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
* WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
* FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
* OTHER DEALINGS IN THE SOFTWARE.
*/

/**
 * TODOs:
 * 1. 增加基本的单元格样式配置
 * 2. 处理移动端浏览器的滑动事件
 * 3. 增加拖动框选功能
 * 4. 编辑状态下回车触发同列下一行的单元格处于选中状态
 * 5. 选中状态下的单元格响应键盘输入并进入编辑状态
 * Finished:
 * 1. 绘制基本表格的功能[Done]
 * 2. 绘制多行头部[Done]
 * 3. 绘制左右固定列[Done]
 * 4. 合并单元格[Done]
 * 5. 列表可鼠标点击拖动[Disable]、滚轮滚动[Done]
 * 6. 增加滚动条[Done]
 * 7. 处理桌面端浏览器的TouchPad事件
 *    {
 *      Mac: Firefox[Done]、Chrome[Done]、Safari[Done]
 *      Windows: Firefox[Done]、Chrome[Done]、Edge[Done]、IE11[Won'tDo]
 *    }
 * 8. 优化单元格渲染方式，解决滚动卡顿问题（1.使用节点缓存[Won'tDo]; 2.优化可视单元格的筛选方式[Done]）
 * 9. 增加点击选中功能[Done]
 * 10. 增加编辑功能[Done]
 * 11. 组件改为外部传入div的引用或者id，组件内部创建canvas和textarea标签[Done]
 */

import { Tween, Ease, Container, Stage, Shape, Text } from 'createjs-module';
import * as util from './util';
import PointerEventHandler from './handler';

/**
 * Default column width
 * @type Number
 * @readonly
 */
const defaultColWidth = 100;
/**
 * Default row height
 * @type Number
 * @readonly
 */
const defaultRowHeight = 32;


/**
 * 基于CreateJs/EaselJS的Web游戏渲染框架实现的表格组件
 */
export default class DataSheet {
  constructor(target) {
    this.initDom(target);
    this.stage = this.initStage(this.canvas);

    // 可视区域宽度高度
    const rect = this.canvas.getBoundingClientRect();
    this.canvasWidth = rect.width;
    this.canvasHeight = rect.height;
    // 全区域宽度高度
    this.totalWidth = 0;
    this.totalHeight = 0;
    // 滚动位置，相对于所有单元格
    this.scrollX = 0;
    this.scrollY = 0;

    // 头部高度
    this.headerHeight = 0;

    // 固定列边界位置
    this.fixedLeftX = 0;
    this.fixedRightX = 0;

    // 当前选中单元格
    this.focusCell = null;
    this.isEditting = false;

    this._handleInput = this.handleInput.bind(this);
  }

  // 初始化canvas
  initDom(target) {
    let root = typeof target === 'string' ? document.getElementById(target) : target;
    this.canvas = document.createElement('canvas');
    this.textarea = document.createElement('textarea');
    root.append(this.canvas);
    root.append(this.textarea);

    root.style['display'] = 'block';
    root.style['position'] = 'relative';

    this.canvas.style['width'] = '100%';
    this.canvas.style['height'] = '100%';
    this.canvas.style['position'] = 'absolute';
    this.canvas.style['left'] = '0';
    this.canvas.style['top'] = '0';
    this.canvas.style['touch-action'] = 'none';

    this.textarea.style['position'] = 'absolute';
    this.textarea.style['left'] = '-10000px';
    this.textarea.style['overflow'] = 'hidden';
    this.textarea.style['border-color'] = '#3691FF';
    this.textarea.style['outline'] = 'none';
    this.textarea.addEventListener('keydown', (evt) => {
      if (evt.key === 'Enter') { // Enter key event
        this.isEditting = false;
        this.render();
        return false;
      }
    });
  }

  // 初始化stage
  initStage(canvas) {
    let ctx = canvas.getContext('2d');
    let devicePixelRatio = window.devicePixelRatio || 1;
    let backingStoreRatio = (
      ctx.webkitBackingStorePixelRatio ||
      ctx.mozBackingStorePixelRatio ||
      ctx.msBackingStorePixelRatio ||
      ctx.oBackingStorePixelRatio ||
      ctx.backingStorePixelRatio || 1
    );
    let ratio = devicePixelRatio || backingStoreRatio;
    let rect = canvas.getBoundingClientRect();
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;

    let stage = new Stage(canvas);
    // stage.enableDOMEvents(true);
    stage.enableMouseOver(10);
    stage.mouseEnabled = true;
    stage.mouseMoveOutside = true;
    stage.scaleX = stage.scaleY = ratio;

    // Handle event
    stage.canvas.addEventListener('wheel', (evt) => {
      // TODO
      // jquery的定义
      // lineHeight: parseInt($parent.css('fontSize'), 10) || parseInt($elem.css('fontSize'), 10) || 16;
      // pageHeight: $(elem).height();
      // 这里定义
      // lineHeight: 16
      // pageHeight: this.canvasHeight || rect.height
      let deltaX = evt.deltaMode === 1 ? evt.deltaX * 16 : evt.deltaMode === 2 ? evt.deltaX * this.canvasHeight : evt.deltaX;
      let deltaY = evt.deltaMode === 1 ? evt.deltaY * 16 : evt.deltaMode === 2 ? evt.deltaY * this.canvasHeight : evt.deltaY;
      this.updateScrollX(deltaX);
      this.updateScrollY(deltaY);
      if (this.isInnerScrolling(deltaY)) {
        evt.preventDefault();
      }
      this.render();
    }, false);
    // 桌面端Edge
    if (util.isEdge() && !util.isMobileBrowser()) {
      let handler = new PointerEventHandler();
      handler.register(
        stage.canvas,
        (evt) => {
          evt.preventDefault();
        },
        (evt, deltaX, deltaY) => {
          this.updateScrollX(deltaX);
          this.updateScrollY(deltaY);
          if (this.isInnerScrolling(deltaY)) {
            evt.preventDefault();
          }
          this.render();
        },
        (evt, deltaX, deltaY) => {
          let config = { deltaX, deltaY };
          // 模拟滚动惯性
          Tween.get(config)
            .to({ deltaX: 0, deltaY: 0 }, 1000, Ease.getPowOut(2))
            .on('change', () => {
              if (handler.isHandling()) {
                Tween.removeAllTweens(config);
                return;
              }
              this.updateScrollX(config.deltaX);
              this.updateScrollY(config.deltaY);
              this.render();
            });
        }
      );
    }
    return stage;
  }

  updateScrollX(deltaX) {
    this.scrollX += isNaN(deltaX) ? 0 : deltaX;
    if (this.scrollX < 0) {
      this.scrollX = 0;
    }
    const max = Math.max(this.totalWidth - this.canvasWidth, 0);
    if (this.scrollX > max) {
      this.scrollX = max;
    }
  }

  updateScrollY(deltaY) {
    this.scrollY += isNaN(deltaY) ? 0 : deltaY;
    if (this.scrollY < 0) {
      this.scrollY = 0;
    }
    const max = Math.max(this.totalHeight - this.canvasHeight + this.headerHeight, 0);
    if (this.scrollY > max) {
      this.scrollY = max;
    }
  }

  // 判断是否为内部滚动
  isInnerScrolling(deltaY) {
    const max = Math.max(this.totalHeight - this.canvasHeight + this.headerHeight, 0);
    return Math.abs(deltaY) < 5 || this.scrollY !== 0 && this.scrollY !== max;
  }

  // 获取省略文本
  getEllipsisText(component, maxWidth) {
    if (component.getMeasuredWidth() <= maxWidth) {
      return component.text;
    }
    let str = component.text.replace(/\r\n|\r|\n/g, '');
    let current = '';
    component.text = '...';
    let postfixWidth = component.getMeasuredWidth();
    for (let i = 0; i < str.length; i++) {
      component.text = current + str[i];
      if (component.getMeasuredWidth() > maxWidth - postfixWidth) break;
      current = component.text;
    }
    if (current.length > 1 && current.length < str.length) {
      component.text = current + '...';
    } else {
      component.text = current;
    }
    return component.text;
  }

  // 创建单元格
  createCell(cell) {
    let width = cell.width;
    let height = cell.height;

    let text = new Text();
    let border = new Shape();
    let container = new Container();
    container.addChild(border, text);

    // 更新单元格内容
    let value;
    if (cell.isHeader) { // 标题行
      border.graphics.beginFill('#F4F4F4')
        .beginStroke('#CCC')
        .drawRect(0, 0, width, height);
      text.color = '#242536';
      value = cell.value || (cell.columns[cell.col] || {}).title || '';
    } else {
      border.graphics.beginFill('#FFF')
        .beginStroke('#CCC')
        .drawRect(0, 0, width, height);
      text.color = '#666';
      value = cell.value || '';
    }

    text.x = 2.0;
    text.y = height / 2.0;
    text.textBaseline = 'middle';
    text.font = '12px Arial';
    text.text = value;
    // 计算文本长度
    if (cell.renderText) {
      text.text = cell.renderText;
    } else {
      cell.renderText = this.getEllipsisText(text, width);
    }

    container.mouseEnabled = true;
    container.x = cell.x;
    container.y = cell.y;
    container.on('click', this.handleCellClick.bind(this, cell));
    container.on('dblclick', this.handleCellDblclick.bind(this, cell));

    return container;
  }

  handleCellClick(cell) {
    this.isEditting = false;
    this.focusCell = cell;
    this.render();
  }

  handleCellDblclick() {
    this.isEditting = true;
    this.render();
  }

  render() {
    let visibleHeaders = this.getVisibleCells(this.headers, this.scrollX, 0, true);
    let visibleCells = this.getVisibleCells(this.cells, this.scrollX, this.scrollY, false);

    let hasFocusCell = false;
    this.stage.removeAllChildren();
    hasFocusCell |= this.renderCells(visibleCells);
    hasFocusCell |= this.renderCells(visibleHeaders);
    this.renderFixedBorder();
    this.renderScrollBar();
    this.renderFocusCell(hasFocusCell ? this.focusCell : null);
    this.stage.update();
  }

  renderFocusCell(cell) {
    // Whatever happend, hide textarea and remove its handler
    this.textarea.style.left = '-9999px';
    this.textarea.removeEventListener('input', this._handleInput);

    if (!cell) return;

    let rect = this.getCrossCellRect(cell);
    if (!rect) return;

    if (!this.focusCellComponent) {
      this.focusCellComponent = new Shape();
    }
    this.stage.addChild(this.focusCellComponent);
    this.focusCellComponent.graphics.clear()
      .beginStroke('#3691FF')
      .drawRect(0, 0, rect.right - rect.left, rect.bottom - rect.top);
    this.focusCellComponent.x = rect.left;
    this.focusCellComponent.y = rect.top;

    // Update textarea settings if currently in edit mode
    if (this.isEditting) {
      this.textarea.value = cell.value;
      this.textarea.style.left = `${rect.left}px`;
      this.textarea.style.top = `${rect.top}px`;
      this.textarea.style.width = `${rect.right - rect.left}px`;
      this.textarea.style.height = `${rect.bottom - rect.top}px`;
      this.textarea.style['min-height'] = `${rect.bottom - rect.top}px`;
      this.textarea.style['max-height'] = `${this.canvasHeight > 100 ? this.canvasHeight : 100}px`;
      setTimeout(this._handleInput, 10); // Manually update textarea's height
      this.textarea.addEventListener('input', this._handleInput);
    }
  }

  handleInput() {
    let scrollHeight = this.textarea.scrollHeight;
    let maxHeight = this.canvasHeight > 100 ? this.canvasHeight : 100;
    this.textarea.style['height'] = `${scrollHeight}px`;
    if (scrollHeight > maxHeight) {
      this.textarea.style['overflow'] = 'auto';
    }
    if (this.focusCell) {
      this.focusCell.value = this.textarea.value;
      this.focusCell.renderText = null;
    }
  }

  // 绘制单元格
  renderCells(cells) {
    let nromal = [];
    let merged = [];
    let leftFixedMerged = [];
    let rightFixedMerged = [];
    let leftFixed = [];
    let rightFixed = [];

    let hasFocusCell = false;
    (cells || []).forEach((cell) => {
      // 生成当前单元格
      let container = this.createCell(cell);
      // 记录选中单元格
      if (this.focusCell == cell) {
        hasFocusCell = true;
      }
      // 分类
      if (cell.merged) {
        if (cell.fixed === 'left') {
          leftFixedMerged.push(container);
        } else if (cell.fixed === 'right') {
          rightFixedMerged.push(container);
        } else {
          merged.push(container);
        }
      } else if (cell.fixed === 'left') {
        leftFixed.push(container);
      } else if (cell.fixed === 'right') {
        rightFixed.push(container);
      } else {
        nromal.push(container);
      }
    });

    nromal.forEach((item) => {
      this.stage.addChild(item);
    });
    merged.forEach((item) => {
      this.stage.addChild(item);
    });
    leftFixed.forEach((item) => {
      this.stage.addChild(item);
    });
    leftFixedMerged.forEach((item) => {
      this.stage.addChild(item);
    });
    rightFixed.forEach((item) => {
      this.stage.addChild(item);
    });
    rightFixedMerged.forEach((item) => {
      this.stage.addChild(item);
    });
    return hasFocusCell;
  }

  // 绘制固定区域的边框渐变线
  renderFixedBorder() {
    // 标题底部边线
    if (this.headerHeight && this.scrollY !== 0) {
      const top = new Shape();
      top.graphics.beginLinearGradientFill(
        ['rgba(0, 0, 0, .5)', 'rgba(255, 255, 255, 0)'],
        [0, 1],
        0, this.headerHeight, 0, this.headerHeight + 4)
        .drawRect(0, this.headerHeight, this.canvasWidth, 4);
      this.stage.addChild(top);
    }
    // 左侧固定列边线
    if (this.fixedLeftX && this.scrollX !== 0) {
      const left = new Shape();
      left.graphics.beginLinearGradientFill(
        ['rgba(0, 0, 0, .5)', 'rgba(255, 255, 255, 0)'],
        [0, 1],
        this.fixedLeftX, 0, this.fixedLeftX + 4, 0)
        .drawRect(this.fixedLeftX, 0, 4, this.canvasHeight);
      this.stage.addChild(left);
    }
    // 右侧固定列边线（TODO 未处理总宽度小于canvas的场景）
    if (
      this.fixedRightX &&
      this.fixedRightX != this.canvasWidth &&
      this.scrollX !== this.totalWidth - this.canvasWidth
    ) {
      const right = new Shape();
      right.graphics.beginLinearGradientFill(
        ['rgba(255, 255, 255, 0)', 'rgba(0, 0, 0, 0.5)'],
        [0, 1],
        this.fixedRightX - 4, 0, this.fixedRightX, 0)
        .drawRect(this.fixedRightX - 4, 0, 4, this.canvasHeight);
      this.stage.addChild(right);
    }
    // 全边框
    const border = new Shape();
    border.graphics.beginFill('transparent')
      .beginStroke('#CCC')
      .drawRect(0, 0, this.canvasWidth, this.canvasHeight);
    this.stage.addChild(border);
  }

  // 绘制滚动条
  renderScrollBar() {
    let barSize = 10;
    // 垂直
    let totalHeight = this.totalHeight + this.headerHeight;
    if (this.canvasHeight < totalHeight) {
      if (!this.vertical) {
        this.vertical = new Shape();
        this.vertical.on('mousedown', (evt) => {
          this.stageMovable = false;
          this.lastScrollY = evt.stageY;
        });
        this.vertical.on('pressmove', (evt) => {
          let deltaY = (evt.stageY - this.lastScrollY) / this.stage.scaleY; // stageY是像素为单位
          this.lastScrollY = evt.stageY;
          this.updateScrollY(deltaY * this.totalHeight / this.canvasHeight);
          this.render();
        });
      }
      let y = this.canvasHeight * (this.scrollY / totalHeight);
      let height = Math.max(this.canvasHeight * (this.canvasHeight / totalHeight), 20);
      this.vertical.graphics.clear().beginFill('rgba(0, 0, 0, 0.4)').drawRoundRect(0, 0, barSize, height, barSize / 2);
      this.vertical.x = this.canvasWidth - barSize;
      this.vertical.y = y;
      this.vertical.cursor = 'pointer';
      this.stage.addChild(this.vertical);
    }
    // 水平
    if (this.canvasWidth < this.totalWidth) {
      if (!this.horizontal) {
        this.horizontal = new Shape();
        this.horizontal.on('mousedown', (evt) => {
          this.stageMovable = false;
          this.lastScrollX = evt.stageX;
        });
        this.horizontal.on('pressmove', (evt) => {
          let deltaX = (evt.stageX - this.lastScrollX) / this.stage.scaleX;  // stageX是像素为单位
          this.lastScrollX = evt.stageX;
          this.updateScrollX(deltaX * this.totalWidth / this.canvasWidth);
          this.render();
        });
      }
      let x = this.canvasWidth * (this.scrollX / this.totalWidth);
      let width = Math.max(this.canvasWidth * (this.canvasWidth / this.totalWidth), 20);
      this.horizontal.graphics.clear().beginFill('rgba(0, 0, 0, 0.4)').drawRoundRect(0, 0, width, barSize, barSize / 2);
      this.horizontal.x = x;
      this.horizontal.y = this.canvasHeight - barSize;
      this.horizontal.cursor = 'pointer';
      this.stage.addChild(this.horizontal);
    }
  }

  /**
   * 更新数据
   * @param {Mixed} options 配置对象
   * {
   *  @param {Array} columns 列描述对象组成的数组[{ title, dataIndex, width, fixed(left|right) }]。注意：fixed会影响desc数据中的row序号
   *  @param {Array} header 行数据对象组成的数组[{ dataIndex1, dataIndex2 }]
   *  @param {Array} headerDesc 单元格描述对象组成的数组[{row, col, colSpan, rowSpan}]
   *  @param {Array} data 行数据对象组成的数组[{ dataIndex1, dataIndex2 }]
   *  @param {Array} dataDesc 单元格描述对象组成的数组[{row, col, colSpan, rowSpan}]
   * }
   */
  setOptions({ columns, header, headerDesc, data, dataDesc }) {
    const _columns = (columns || []).sort((a, b) => {
      let v1 = a.fixed === 'left' ? 2 : a.fixed === 'right' ? 0 : 1;
      let v2 = b.fixed === 'left' ? 2 : b.fixed === 'right' ? 0 : 1;
      return v2 - v1;
    }).map((d) => {
      d.width = d.width > 0 ? d.width : defaultColWidth;
      return d;
    });
    const _header = (header && header.length > 0) ? header.map((d) => {
      d.isHeader = true;
      return d;
    }) : [{ isHeader: true, columns: _columns }];

    // 头部数据高度
    this.headerHeight = this.getHeaderHeight(_header);

    // 更新全区域宽度高度
    this.totalHeight = (data || []).length * defaultRowHeight; // TODO 考虑增加最后一行的合并后的高度
    this.totalWidth = _columns.reduce((sum, c) => (sum + c.width), 0);

    // 固定列边界位置
    const lFixedCols = _columns.filter(i => i.fixed === 'left');
    const rFixedCols = _columns.filter(i => i.fixed === 'right');
    this.fixedLeftX = lFixedCols.reduce((sum, c) => (sum + c.width), 0);
    this.fixedRightX = Math.max(this.canvasWidth - rFixedCols.reduce((sum, c) => (sum + c.width), 0), 0);

    // 单元格数据
    this.headers = this.getCells(_columns, _header, headerDesc, 0);
    this.cells = this.getCells(_columns, data, dataDesc, this.headerHeight);

    this.render();
  }

  // 计算区域内可视行数据
  getVisibleCells(cells, scrollX = 0, scrollY = 0, isHeader = false) {
    let rows = [];
    let startY = isHeader ? 0 : this.headerHeight;
    (cells || []).forEach((row) => {
      if (!row || !this.isRowVisible(row.top - scrollY, row.bottom - scrollY, 0)) {
        return;
      }
      (row || []).forEach((cell) => {
        let l = cell.sourceX - scrollX;
        let r = l + cell.width;
        let t = cell.sourceY - scrollY;
        let b = t + cell.height;

        if (cell.fixed === 'left') {
          cell.x = cell.sourceX;
          cell.y = t;
          rows.push(cell);
        } else if (cell.fixed === 'right') {
          cell.x = this.canvasWidth - (this.totalWidth - cell.sourceX);
          cell.y = t;
          rows.push(cell);
        } else if (this.isVisible(l, t, r, b, startY)) {
          cell.x = l;
          cell.y = t;
          rows.push(cell);
        }
      });
    });
    return rows;
  }

  // 判断指定上下边界的行是否可见
  isRowVisible(t, b, startY) {
    return !(b <= startY || t >= this.canvasHeight);
  }

  // 判断指定左右边界的列是否可见
  isColVisible(l, r) {
    return !(r <= this.fixedLeftX || l >= this.fixedRightX);
  }

  // 判断指定上下左右边界的单元格是否可见
  isVisible(l, t, r, b, startY) {
    return !(b <= startY || t >= this.canvasHeight) && !(r <= this.fixedLeftX || l >= this.fixedRightX);
  }

  // 获取单元格信息
  getCells(columns, data, desc, startY = 0) {
    let cells = [];
    // 生成单元格矩阵
    for (let i = 0; i < (data || []).length; i++) {
      let d = data[i] || {};
      let startX = 0;
      let row = [];
      for (let j = 0; j < (columns || []).length; j++) {
        let c = columns[j] || {};
        let item = {
          row: i,
          col: j,
          value: d[c.dataIndex],
          sourceX: startX,
          sourceY: startY + defaultRowHeight * i,
          width: c.width,
          height: defaultRowHeight,
          fixed: c.fixed,
          isHeader: d.isHeader || false,
          columns: columns
        };
        row.push(item);
        startX += c.width;
      }
      cells.push(row);
    }
    // 统计合并信息
    (desc || []).forEach((c) => {
      let row = cells[c.row];
      if (!row) {
        console.warn('desc rule error: ', c);
        return;
      }
      let current = row[c.col];
      if (!current) {
        console.warn('desc rule error: ', c);
        return;
      }
      // 计算合并后的宽度
      if (c.colSpan > 1) {
        let width = current.width;
        for (let i = 1; i < c.colSpan; i++) {
          let cell = row[c.col + i];
          // 相邻列不存在，终止继续合并
          if (!cell) break;
          // 不同为固定列或不是同类型固定列，终止继续合并
          if (current.fixed !== cell.fixed) break;
          width += cell.width;
        }
        current.width = width;
        current.merged = true;
      }
      // 更新合并后的高度
      if (c.rowSpan > 1) {
        current.height = defaultRowHeight * Math.min(c.rowSpan, cells.length - c.row);
        current.merged = true;
      }
    });

    let currentY = 0;
    (cells || []).map((row) => {
      let max = (row || []).reduce((max, current) => Math.max(max, current.height), 0);
      row.top = currentY;
      row.bottom = currentY + max;
      currentY += defaultRowHeight;
    });
    return cells;
  }

  // 获取表头高度
  getHeaderHeight(header) {
    return defaultRowHeight * (header && header.length > 0 ? header.length : 0);
  }

  // 获取单元格
  getCrossCellRect(cell) {
    let rect = { left: cell.x, top: cell.y, right: cell.x + cell.width, bottom: cell.y + cell.height };
    let result;
    if (cell.isHeader) {
      if (cell.fixed === 'left') {
        result = this.getCrossRect(0, 0, this.fixedLeftX, this.headerHeight,
          rect.left, rect.top, rect.right, rect.bottom);
      } else if (cell.fixed === 'right') {
        result = this.getCrossRect(this.fixedRightX, 0, this.canvasWidth, this.headerHeight,
          rect.left, rect.top, rect.right, rect.bottom);
      } else {
        result = this.getCrossRect(this.fixedLeftX, 0, this.fixedRightX, this.headerHeight,
          rect.left, rect.top, rect.right, rect.bottom);
      }
    } else {
      result = this.getCrossRect(0, 0, this.canvasWidth, this.canvasHeight,
        rect.left, rect.top, rect.right, rect.bottom);
      if (!result) return null;
      if (cell.fixed === 'left') {
        result = this.getCrossRect(0, this.headerHeight, this.fixedLeftX, this.canvasHeight,
          rect.left, rect.top, rect.right, rect.bottom);
      } else if (cell.fixed === 'right') {
        result = this.getCrossRect(this.fixedRightX, this.headerHeight, this.canvasWidth, this.canvasHeight,
          rect.left, rect.top, rect.right, rect.bottom);
      } else {
        result = this.getCrossRect(this.fixedLeftX, this.headerHeight, this.fixedRightX, this.canvasHeight,
          rect.left, rect.top, rect.right, rect.bottom);
      }
    }
    return result;
  }

  // 获取两个矩形的交集所形成的小矩形，无交集返回null
  getCrossRect(l1, t1, r1, b1, l2, t2, r2, b2) {
    if (
      typeof l1 !== 'number' || typeof t1 !== 'number' || typeof r1 !== 'number' || typeof b1 !== 'number' ||
      typeof l2 !== 'number' || typeof t2 !== 'number' || typeof r2 !== 'number' || typeof b2 !== 'number'
    ) {
      return null;
    }
    if (l1 >= r2 || t1 >= b2 || r1 <= l2 || b1 <= t2) return null;
    let l = Math.max(l1, l2);
    let t = Math.max(t1, t2);
    let r = Math.min(r1, r2);
    let b = Math.min(b1, b2);
    if (l >= r || t >= b) return null;
    return { left: l, top: t, right: r, bottom: b };
  }
}