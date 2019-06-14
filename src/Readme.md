### Basic
```
import DataSheet from 'chardlau-datasheet';
let dataSheet = new DataSheet("myCanvasContainer");
dataSheet.update(options);
```

### Options
Options for DataSheet:
#### columns

Array of column description 

* title: If header cell do not specific any value, title will be its value
* dataIndex
* width
* fixed: Only 'left' or 'right' is valid. ( Note：`fixed` will effect the final order of the column. 'left' fixed column will be sorted forward while 'right' fixed column will be backward.) 


#### data [optional]

#### dataDesc [optional]

#### header [optional]

Same with data.

#### headerDesc [optional]

Same with dataDesc.





### Config cell style
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