/*!
* DataSheet
* A table component base on CreateJs/EaselJS for displaying large
* scale number of data on web page.
*
* Copyright (c) 2019 chardlau.com<chardlau@outlook.com>.
*/

/**
 * TODOs:
 * 1. Support scrolling in touch screen
 * 2. Handle 'Tab' and 'Enter' keyboard event
 * 3. Make row height configurable
 * Finished:
 * 1. Basic data sheet render[Done]
 * 2. Support multi-row header[Done]
 * 3. Support fixed left and fixed right column[Done]
 * 4. Support cell merge[Done]
 * 5. Support mouse wheel scrolling[Done]
 * 6. Add scroll bar[Done]
 * 7. Support touch pad scrolling with browsers listed below 
 *    {
 *      Mac: Firefox[Done]、Chrome[Done]、Safari[Done]
 *      Windows: Firefox[Done]、Chrome[Done]、Edge[Done]、IE11[Won'tDo]
 *    }
 * 8. Optimize visible cells calculation。O(m+n) m for row size, n for column size.[Done]
 * 9. Support selected cell highlight[Done]
 * 10. Support edit cell value[Done]
 * 11. Create canvas and textarea internally[Done]
 * 12. Support basic cell's style configuration[Done]
 * 13. Selected cell listens keyboard event and enter edit mode[Done]
 * 14. Support custom cell text format[Done]
 * 15. Support readOnly option for cell[Done]
 */
import { Container, Stage, Shape, Text } from 'createjs-module';
import Editor from './input';
import EventHandler from './handler';
import * as browser from './browser';
import * as util from './util';

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
 * A table component base on CreateJs/EaselJS for displaying large
 * scale number of data on web page.
 */
export default class DataSheet {
  constructor(target) {
    this.initDom(target);
    this.initStage();
    this.initValues();
  }

  initValues() {
    const rect = this.canvas.getBoundingClientRect();

    // canvas width and height
    this.canvasWidth = rect.width;
    this.canvasHeight = rect.height;

    // cell's total width and height, without header
    this.totalWidth = 0;
    this.totalHeight = 0;

    // header height
    this.headerHeight = 0;

    // scroll position
    this.scrollX = 0;
    this.scrollY = 0;

    // fixed column's edge position in x-axis
    this.fixedLeftX = 0;
    this.fixedRightX = 0;

    // current selected cell
    this.focusCell = null;

    // border color
    this.borderColor = '#CCC';
    // highlight color
    this.highlightColor = '#3691FF';
    // default cell style
    this.defaultCellStyle = {
      paddingLeft: 4,
      paddingTop: 4,
      paddingRight: 4,
      paddingBottom: 4,
      color: '#666',
      fontSize: 12,
      fontWeight: 'normal',
      fontFamily: 'Arial',
      textAlign: 'left',  // left|start, right|end, center
      verticalAlign: 'middle', // top, middle, bottom
      backgroundColor: '#FFF',
    };
    // default header cell style
    this.defaultHeaderStyle = {
      color: '#242536',
      fontSize: 14,
      fontWeight: 'bold',
      backgroundColor: '#F4F4F4',
    };
  }

  // Initial root, canvas and textarea
  initDom(target) {
    this.canvas = document.createElement('canvas');
    this.canvas.style['width'] = '100%';
    this.canvas.style['height'] = '100%';
    this.canvas.style['position'] = 'absolute';
    this.canvas.style['left'] = '0';
    this.canvas.style['top'] = '0';
    this.canvas.style['touch-action'] = 'none';
    this.canvas.style['z-index'] = '5';

    // Create editor
    this.editor = new Editor();
    this.editor.on('show', (evt) => {
      this.handleBeginEdit(evt);
    });
    this.editor.on('hide', () => {
      this.hideTextArea();
      this.render();
    });

    this.root = typeof target === 'string' ? document.getElementById(target) : target;
    this.root.append(this.canvas);
    this.root.append(this.editor.el);
    this.root.style['display'] = 'block';
    this.root.style['box-sizing'] = 'border-box';
    this.root.style['position'] = 'relative';
    this.root.style['overflow'] = 'hidden';
  }

  // Initial stage of Createjs/EaselJs
  initStage() {
    let canvas = this.canvas;
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
    stage.enableDOMEvents(true);
    stage.enableMouseOver(10);
    stage.mouseEnabled = true;
    stage.mouseMoveOutside = true;
    stage.scaleX = stage.scaleY = ratio;
    let handler = new EventHandler();
    handler.register(
      stage.canvas,
      (evt, deltaX, deltaY) => {
        this.updateScrollX(deltaX);
        this.updateScrollY(deltaY);

        // evt.preventDefault();
        if (this.shouldPreventDefault(deltaX)) {
          evt.preventDefault();
        }
        this.render();
      },
    );
    this.stage = stage;
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

  /**
   * Check whether should this component consume the scoll event.
   * @param {Number} deltaX Delta of scroll X
   */
  shouldPreventDefault(deltaX) {
    // TODO
    const maxH = Math.max(this.totalHeight - this.canvasHeight + this.headerHeight, 0);
    console.log('should:', (this.scrollY !== 0 && this.scrollY !== maxH));
    // If moving in horizontal direction, or scroll Y did not reach top or bottom edge
    return true; // (this.scrollY !== 0 && this.scrollY !== maxH);
  }

  /**
   * Get ellipsis text for Text component.
   * @param {Object} component Text component of EaselJs
   * @param {Object} cell Cell data info object
   */
  getEllipsisText(component, cell) {
    let style = cell.style || {};
    let maxWidth = cell.width - (style.paddingLeft || 0) - (style.paddingRight || 0);
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

  /**
   * Create cell and update its content
   * @param {Object} cell Cell object generated by `getVisibleCells`
   */
  createCell(cell) {
    let width = cell.width;
    let height = cell.height;

    let text = new Text();
    let border = new Shape();
    let container = new Container();
    container.addChild(border, text);

    // default value for text
    let defaultValue = cell.isHeader ? (cell.columns[cell.col] || {}).title || '' : '';
    
    // Update border
    let style = cell.style || this.defaultCellStyle;
    border.graphics.beginFill(style.backgroundColor)
      .beginStroke(style.borderColor)
      .drawRect(0, 0, width, height);

    // update text
    let value = cell.value || defaultValue;
    if (cell.render && typeof cell.render === 'function') {
      value = cell.render(value, cell);
    }

    text.text = value;
    text.textBaseline = (style.verticalAlign === 'middle' || style.verticalAlign === 'bottom') ? style.verticalAlign : 'top';
    text.textAlign = style.textAlign;
    text.font = `${style.fontWeight} ${style.fontSize}px ${style.fontFamily}`.trim();
    text.color = style.color;
    text.x =  (style.textAlign === 'center') ? width / 2.0
      : (style.textAlign === 'end' || style.textAlign === 'right') ? width - style.paddingRight : style.paddingLeft;
    text.y = (style.verticalAlign === 'middle') ? height / 2.0
      : (style.verticalAlign === 'bottom') ? height - style.paddingBottom : style.paddingTop; // height / 2.0;

    // Cell's `renderText` cache the ellipsis value for text component.
    // If cell value is updated, `renderText` should cover by null
    if (cell.renderText) {
      // `renderText` exist
      text.text = cell.renderText;
    } else {
      // If `renderText` is not exist, calculate
      cell.renderText = this.getEllipsisText(text, cell);
    }
    if (!cell.hitArea) {
      let r = text.getBounds();
      let hit = new Shape();
      hit.graphics.beginFill('#000').drawRect(r.x, r.y, r.width, r.height);
      cell.hitArea = hit;
    }
    text.hitArea = cell.hitArea;
    text.on('click', () => { console.log('text click'); });
    text.on('mouseover', (evt) => {
      evt.target.color = this.highlightColor;
      this.stage.update();
    });
    text.on('mouseout', (evt) => {
      evt.target.color = style.color;
      this.stage.update();
    });

    container.mouseEnabled = true;
    container.x = cell.x;
    container.y = cell.y;
    container.on('click', this.handleCellClick.bind(this, cell));
    container.on('dblclick', this.handleCellDblclick.bind(this, cell));

    return container;
  }

  handleCellClick(cell) {
    this.focusCell = cell;
    let rect = this.getCrossCellRect(this.focusCell);
    this.editor.prepare(cell.value, cell.x, cell.y, rect.right - rect.left, rect.bottom - rect.top, cell.height);
    this.renderFocusCell(this.focusCell); // The shape insert into stage can be reused by render function
    this.stage.update();
  }

  handleCellDblclick() {
    if (this.focusCell.readOnly) return;
    let rect = this.getCrossCellRect(this.focusCell);
    this.showTextArea(this.focusCell, rect);
  }

  handleBeginEdit (evt) {
    if (!this.focusCell || this.focusCell.readOnly) return;
    const keyCode = evt.keyCode || evt.which;
    if (keyCode != 13) { // reset cell if begin is no trigger by Enter key
      this.focusCell.value = '';
    }
    let rect = this.getCrossCellRect(this.focusCell);
    this.showTextArea(this.focusCell, rect);
  }

  handleInput (evt, value) {
    if (this.focusCell) {
      this.focusCell.value = value;
      this.focusCell.renderText = null;
    }
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
    if (!cell) {
      // Hide textarea
      this.editor.update(-1000, -1000, 0);
      return;
    }

    let rect = this.getCrossCellRect(cell);
    if (!rect) {
      // Hide textarea
      this.editor.update(-1000, -1000, 0);
      return;
    }

    // Render cell
    if (!this.focusCellComponent) {
      this.focusCellComponent = new Shape();
    }
    this.stage.addChild(this.focusCellComponent);
    this.focusCellComponent.graphics.clear()
      .beginStroke(this.highlightColor)
      .drawRect(0, 0, rect.right - rect.left, rect.bottom - rect.top);
    this.focusCellComponent.x = rect.left;
    this.focusCellComponent.y = rect.top;

    // Update textarea
    this.editor.update(rect.left, rect.top, rect.right - rect.left);
  }

  hideTextArea() {
    this.editor.hide();
    this.editor.remove('input');
  }

  showTextArea(cell, rect) {
    this.editor.show(cell.value, cell.width, rect);
    this.editor.on('input', (evt, value) => {
      this.handleInput(evt, value);
    });
  }

  renderCells(cells) {
    let nromal = [];
    let merged = [];
    let leftFixedMerged = [];
    let rightFixedMerged = [];
    let leftFixed = [];
    let rightFixed = [];

    let hasFocusCell = false;
    (cells || []).forEach((cell) => {
      let container = this.createCell(cell);
      // Mark selected cell flag
      if (this.focusCell == cell) {
        hasFocusCell = true;
      }
      // Class cell into different layers
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

    // Add to stage for render
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

  renderFixedBorder() {
    // Header's bottom edge
    if (this.headerHeight && this.scrollY !== 0) {
      const top = new Shape();
      top.graphics.beginLinearGradientFill(
        ['rgba(0, 0, 0, .5)', 'rgba(255, 255, 255, 0)'],
        [0, 1],
        0, this.headerHeight, 0, this.headerHeight + 4)
        .drawRect(0, this.headerHeight, this.canvasWidth, 4);
      this.stage.addChild(top);
    }
    // Fixed left columns's right edge
    if (this.fixedLeftX && this.scrollX !== 0) {
      const left = new Shape();
      left.graphics.beginLinearGradientFill(
        ['rgba(0, 0, 0, .5)', 'rgba(255, 255, 255, 0)'],
        [0, 1],
        this.fixedLeftX, 0, this.fixedLeftX + 4, 0)
        .drawRect(this.fixedLeftX, 0, 4, this.canvasHeight);
      this.stage.addChild(left);
    }
    // Fixed right columns's left edge（TODO what if total width of columns smaller than canvas width）
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
    // Render canvas border
    const border = new Shape();
    border.graphics.beginFill('transparent')
      .beginStroke(this.borderColor)
      .drawRect(0, 0, this.canvasWidth, this.canvasHeight);
    this.stage.addChild(border);
  }

  renderScrollBar() {
    let barSize = 10;
    // vertical direction
    let allHeight = this.totalHeight + this.headerHeight;
    if (this.canvasHeight < allHeight) {
      if (!this.vertical) {
        this.vertical = new Shape();
        this.vertical.on('mousedown', (evt) => {
          this.stageMovable = false;
          this.lastScrollY = evt.stageY;
        });
        this.vertical.on('pressmove', (evt) => {
          let deltaY = (evt.stageY - this.lastScrollY) / this.stage.scaleY; // stageY must scale down
          this.lastScrollY = evt.stageY;
          this.updateScrollY(deltaY * this.totalHeight / this.canvasHeight);
          this.render();
        });
      }
      let y = this.canvasHeight * (this.scrollY / allHeight);
      let height = Math.max(this.canvasHeight * (this.canvasHeight / allHeight), 20);
      this.vertical.graphics.clear().beginFill('rgba(0, 0, 0, 0.4)').drawRoundRect(0, 0, barSize, height, barSize / 2);
      this.vertical.x = this.canvasWidth - barSize;
      this.vertical.y = y;
      this.vertical.cursor = 'pointer';
      this.stage.addChild(this.vertical);
    }
    // horizontal direction
    if (this.canvasWidth < this.totalWidth) {
      if (!this.horizontal) {
        this.horizontal = new Shape();
        this.horizontal.on('mousedown', (evt) => {
          this.stageMovable = false;
          this.lastScrollX = evt.stageX;
        });
        this.horizontal.on('pressmove', (evt) => {
          let deltaX = (evt.stageX - this.lastScrollX) / this.stage.scaleX;  // NOTE: stageX must scale down
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
   * Update data or setting
   * @param {Object} options Data or setting for DataSheet
   * {
   *  @param {Array} columns [{ title, dataIndex, width, fixed(left|right) }] Note: fixed will effect column's order
   *  @param {Array} header 行数据对象组成的数组[{ dataIndex1, dataIndex2 }]
   *  @param {Array} headerDesc 单元格描述对象组成的数组[{row, col, colSpan, rowSpan}]
   *  @param {Array} data 行数据对象组成的数组[{ dataIndex1, dataIndex2 }]
   *  @param {Array} dataDesc 单元格描述对象组成的数组[{row, col, colSpan, rowSpan}]
   * }
   */
  update({ columns, header, headerDesc, data, dataDesc, borderColor }) {
    const _columns = (columns || []).map((i, index)=> {
      i.i = index;
      return i;
    }).sort((a, b) => {
      let v1 = a.fixed === 'left' ? 2 : a.fixed === 'right' ? 0 : 1;
      let v2 = b.fixed === 'left' ? 2 : b.fixed === 'right' ? 0 : 1;
      // Make sure sort is stable, we use item's index as fallback element
      return v2 - v1 === 0 ? a.i - b.i : v2 - v1;
    }).map((d) => {
      d.width = d.width > 0 ? d.width : defaultColWidth;
      return d;
    });
    const _header = (header && header.length > 0) ? header.map((d) => {
      d.isHeader = true;
      return d;
    }) : [{ isHeader: true, columns: _columns }];

    // Update border color
    if (borderColor) this.borderColor = borderColor;

    // Update header height
    this.headerHeight = this.getHeaderHeight(_header);

    // Update cells's total height
    this.totalHeight = (data || []).length * defaultRowHeight; // TODO 考虑增加最后一行的合并后的高度
    this.totalWidth = _columns.reduce((sum, c) => (sum + c.width), 0);

    // Update fixed columns's edge position
    const lFixedCols = _columns.filter(i => i.fixed === 'left');
    const rFixedCols = _columns.filter(i => i.fixed === 'right');
    this.fixedLeftX = lFixedCols.reduce((sum, c) => (sum + c.width), 0);
    this.fixedRightX = Math.max(this.canvasWidth - rFixedCols.reduce((sum, c) => (sum + c.width), 0), 0);

    // Calculate cell infos
    this.headers = this.getCells(_columns, _header, headerDesc, 0);
    this.cells = this.getCells(_columns, data, dataDesc, this.headerHeight);

    this.render();
  }

  /**
   * Get visible cells
   * @param {Array} cells cell informations from `getCells` function
   * @param {*} scrollX scroll x
   * @param {*} scrollY scroll y
   * @param {*} isHeader flag for judging cell type
   * @return Array of visible cells
   */
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
        } else if (this.isCellVisible(l, t, r, b, startY)) {
          cell.x = l;
          cell.y = t;
          rows.push(cell);
        }
      });
    });
    return rows;
  }

  isRowVisible(t, b, startY) {
    return !(b <= startY || t >= this.canvasHeight);
  }

  isCellVisible(l, t, r, b, startY) {
    return !(b <= startY || t >= this.canvasHeight) && !(r <= this.fixedLeftX || l >= this.fixedRightX);
  }

  /**
   * Get style for cell.
   * @param {Mixed} styles Style array or object.
   * If array provided, fields from higher index item will cover the lower one
   * @return style object
   */
  getCellStyle(styles) {
    let freeze = { borderColor: this.borderColor };
    return Array.isArray(styles) ?  Object.assign({}, ...styles, freeze) : Object.assign({}, styles, freeze);
  }

  /**
   * Get render for cell to format text.
   * @param {Array} renders Array of render, first valid function will be used
   * @return Render function or null if none is valid.
   */
  getCellRender(renders) {
    if (!renders || !Array.isArray(renders)) return null;
    return renders.find(r => !!r && typeof r === 'function');
  }

  /**
   * Calculate cells information
   * @param {*} columns columns from `update` fonction
   * @param {*} data header or cell data from `update` fonction.
   * @param {*} desc description for header or cell data
   * @param {*} startY start Y position. Which effect the cell's `sourceX`
   */
  getCells(columns, data, desc, startY = 0) {
    let cells = [];
    // Get infos from columns and data
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
          columns: columns,
          style: this.getCellStyle([this.defaultCellStyle, d.isHeader ? this.defaultHeaderStyle : null, c.style, d.style]),
          render: this.getCellRender([d.render, c.render]),
          readOnly: d.isHeader || false,
        };
        if (c.hasOwnProperty('readOnly')) item.readOnly = c.readOnly;
        if (d.hasOwnProperty('readOnly')) item.readOnly = d.readOnly;
        row.push(item);
        startX += c.width;
      }
      cells.push(row);
    }
    // Update with desc
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
      // Update width
      if (c.colSpan > 1) {
        let width = current.width;
        for (let i = 1; i < c.colSpan; i++) {
          let cell = row[c.col + i];
          // Neighbou cell do not exist
          if (!cell) break;
          // Cells in different type of columns can't merge together
          if (current.fixed !== cell.fixed) break;
          width += cell.width;
        }
        current.width = width;
        current.merged = true;
      }
      // Update hight
      if (c.rowSpan > 1) {
        current.height = defaultRowHeight * Math.min(c.rowSpan, cells.length - c.row);
        current.merged = true;
      }
      // Update style
      if (c.style) {
        current.style = this.getCellStyle([current.style, c.style]);
      }
      // Update render
      if (c.render) {
        current.render = this.getCellRender([c.render, current.render]);
      }
      // Update readOnly
      if (c.hasOwnProperty('readOnly')) {
        current.readOnly = c.readOnly;
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

  getHeaderHeight(header) {
    return defaultRowHeight * (header && header.length > 0 ? header.length : 0);
  }

  /**
   * Get rect that is specific cell crosses with other reasonable areas.
   * @param {Object} cell Cell info object
   */
  getCrossCellRect(cell) {
    let rect = { left: cell.x, top: cell.y, right: cell.x + cell.width, bottom: cell.y + cell.height };
    let result;
    if (cell.isHeader) {
      if (cell.fixed === 'left') {
        result = util.getCrossRect(0, 0, this.fixedLeftX, this.headerHeight,
          rect.left, rect.top, rect.right, rect.bottom);
      } else if (cell.fixed === 'right') {
        result = util.getCrossRect(this.fixedRightX, 0, this.canvasWidth, this.headerHeight,
          rect.left, rect.top, rect.right, rect.bottom);
      } else {
        result = util.getCrossRect(this.fixedLeftX, 0, this.fixedRightX, this.headerHeight,
          rect.left, rect.top, rect.right, rect.bottom);
      }
    } else {
      result = util.getCrossRect(0, 0, this.canvasWidth, this.canvasHeight,
        rect.left, rect.top, rect.right, rect.bottom);
      if (!result) return null;
      if (cell.fixed === 'left') {
        result = util.getCrossRect(0, this.headerHeight, this.fixedLeftX, this.canvasHeight,
          rect.left, rect.top, rect.right, rect.bottom);
      } else if (cell.fixed === 'right') {
        result = util.getCrossRect(this.fixedRightX, this.headerHeight, this.canvasWidth, this.canvasHeight,
          rect.left, rect.top, rect.right, rect.bottom);
      } else {
        result = util.getCrossRect(this.fixedLeftX, this.headerHeight, this.fixedRightX, this.canvasHeight,
          rect.left, rect.top, rect.right, rect.bottom);
      }
    }
    return result;
  }
}