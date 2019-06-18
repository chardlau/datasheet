
## Usage

Provide a container dom.

``` html
...
<div id="target" style="height: 200px"></div>
...
```

Create DataSheet and update options.

``` javascript
var options = {...};
var dataSheet = new DataSheet("target");
dataSheet.update(options);
```

## Example

See `example` directory.

## Options
#### columns

Array of column description 

* title: If header cell do not provide any value, title will be its value
* dataIndex: `required` Important field which indicates where to fetch text for current column's cells.(Note: `style` and `render` is keyword, must no use here.)
* width: Column width.
* fixed: Only 'left' or 'right' is valid. (Note：`fixed` will effect the final order of the column. 'left' fixed column will be sorted forward while 'right' fixed column will be backward.) 
* style: Style for current column's cells.
* render: Text formatter function for current column's cells.


#### data [optional]

`data` field is an array. Each element is a source data for a single row in DataSheet.

#### dataDesc [optional]

`dataDesc` field is an array. Each element is a source data description for a single cell in DataSheet.
* col: `required`. Index of sorted columns.
* row: `required`. Index of row.
* rowSpan: Number of rows the cell used. Default 1.
* colSpan: Number of columns the cell used. Default 1.
* style: Style for current cell.
* render: Text formatter function for current cell.

#### header [optional]

Same with data.

#### headerDesc [optional]

Same with dataDesc.


## Config cell style
Configuable style fields are:
* paddingLeft: Useless if textAlign is 'center'
* paddingTop: Useless if verticalAlign is 'middle'
* paddingRight: Useless if textAlign is 'center'
* paddingBottom: Useless if verticalAlign is 'middle'
* color: Color for text
* fontSize
* fontWeight
* fontFamily: Only support one font at a time
* textAlign: Supports left|start, right|end, center. Defalt 'left'
* verticalAlign: , Supports top, middle, bottom. Default 'middle'
* backgroundColor

Default header cell style
```
{
  paddingLeft: 4,
  paddingRight: 4,
  color: '#666',
  fontSize: 12,
  fontWeight: 'normal',
  fontFamily: 'Arial',
  backgroundColor: '#FFF',
}
```
Default header cell style
```
{
  paddingLeft: 4,
  paddingRight: 4,
  color: '#242536',
  fontSize: 14,
  fontWeight: 'bold',
  fontFamily: 'Arial',
  backgroundColor: '#F4F4F4',
}
```