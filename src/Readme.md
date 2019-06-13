### Basic
```
import DataSheet from 'chardlau-datasheet';
let dataSheet = new DataSheet("myCanvasContainer");
dataSheet.update(options);
```

### Options
Options for DataSheet:
1. columns

Array of column description 

* title: If header cell do not specific any value, title will be its value
* dataIndex
* width
* fixed: Only 'left' or 'right' is valid. ( Note：`fixed` will effect the final order of the column. 'left' fixed column will be sorted forward while 'right' fixed column will be backward.) 

2. header [optional]

3. headerDesc [optional]

4. data [optional]

5. dataDesc [optional]




### Config cell style
Configuable style fields are:
* paddingLeft
* paddingRight
* color: Color for text
* fontSize
* fontWeight
* fontFamily: Only support one font at a time
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