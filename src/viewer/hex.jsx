import { TapirAPI } from "./../login.js";

import React from "react";

import "regular-table";
import "regular-table/dist/css/material.css"; //XXX remove and put style in dark.css or use default style 

const CACHE_SIZE = 1024;
var   TABLE_ID = 0;

class RowCache
{
  constructor(data, start_offset, size)
  {
    this.rows = null;
    this.row_start = null;
    this.row_count = null;
  }

  reset()
  {
    this.rows = null;
    this.row_start = null;
    this.row_count = null;
  }

  update(rows, row_start)
  {
    this.rows = rows
    this.row_start = row_start;
    this.row_count = rows[0].length;
  }

  data(row_start, size)
  {
    if (this.data == null)
    {
      return (null);
    }

    if ((row_start >= this.row_start) && ((row_start + size) <= (this.row_start + this.row_count)))
    {
      let relative_start = row_start - this.row_start;
      let offset = this.rows[0].slice(relative_start, relative_start + size);
      let hex = this.rows[1].slice(relative_start, relative_start + size);
      let ascii = this.rows[2].slice(relative_start, relative_start +size);
      let rows = [offset, hex, ascii];

      return (rows);
    }

    return (null);
  }
}

//Must bufferize read by 4096 block or 1024 (mtu) => then if in buffer return the line, if not read remotely
export default class HexViewer extends React.Component 
{
  constructor(props)
  {
    super(props);
    this.table_id = TABLE_ID;
    TABLE_ID += 1;
    this.api = TapirAPI();
    this.cache = new RowCache();
  }

  componentDidMount() 
  {
    this.newFile();
  }

  componentDidUpdate(prevProps) 
  {
    if (prevProps.node_id !== this.props.node_id)
    {
      this.newFile();
    }
  }

  async dataListener(viewport)
  {
    let [, y0, , y1] = viewport;
    let data = await this.get_row(y0, y1);
    return (   
    {
      num_rows: this.props.fileSize/16,
      num_columns: 3,
      row_headers: null,
      column_headers: [['Offset'], [' 0  1  2  3  4  5  6  7  8  9  A  B  C  D  E  F'], ['0123456789ABCDEF']],
      data: data,
    });
  }

  //could be use on very large file to prevent to scroll too much
  //but this is not enough for at least file >= 80go 
  //it's still scroll of large value : 0xc360 (3126 line) 
  /*wheelCallBack(event)
  {
    const table = document.getElementsByTagName("regular-table")[0];

    const isFirefox = navigator.userAgent.toLowerCase().indexOf("firefox") > -1;
    //const BROWSER_MAX_HEIGHT = isFirefox ? 5000000 : 10000000;
    //console.log('max height ', BROWSER_MAX_HEIGHT);

    //console.log('detail', event.detail);
    //console.log('wh', event.wheelData);
    if (event.detail >= 0)
    {
      table.scrollTop += 1;
    }
    else
    {
      table.scrollTop -= 1;
    }
    event.preventDefault();
  }*/

  newFile()
  {
    let table = document.getElementById("regular-table-" + this.table_id);
    //table.addEventListener("DOMMouseScroll", this.wheelCallBack);
    //table.addEventListener("wheel", this.wheelCallBack);
    table.scrollTop = 0; //we set the scrollbar back to top as we open new document
    this.cache.reset();

    table.setDataListener((...viewport) => 
    {
       return this.dataListener(viewport,{virtual_mode: "vertical"});
    });
    table.draw();
  }

  async get_row(row_start, row_end)
  {
    //we got float number when the line not full (for file not % 16)
    //so we must round up so we got partial line from the cache 
    //and display it
    row_end = Math.ceil(row_end);
    
    //happend one in two times
    if (row_start === 0 && row_end === 0)
    {
      return ([[], [], []]);
    }
  
    let cached_data = this.cache.data(row_start, row_end - row_start)
    if (cached_data)
    {
      return (cached_data);
    }

    let offset_start = row_start *16;
    //let offset_end = row_end * 16;

    let data = await this.read(this.props.node_id, CACHE_SIZE, offset_start);
    if (data && data.byteLength !== 0)
    {
      let tables = this.data_to_hex(data, offset_start);
      this.cache.update(tables, row_start);
      return this.cache.data(row_start, row_end - row_start);
    }
    //show an error message in the widget or a notification ?
    return ([[], [], []]); //if error we return void table
  }

  async read(node_id, size, offset)
  {
    let response = await this.api.read(node_id, size, offset)
    .catch((error) => 
    {
      return (null);
    });
    if (response != null)
    {
      return await response.data.arrayBuffer();
    }
    return (null);
  }

  data_to_hex(data, remote_offset)
  {
    let offset_table = [];
    let hex_table = [];
    let ascii_table = [];

    let offset_shift = 0;
    while (offset_shift < data.byteLength)
    {
      let data_chunk = new Uint8Array(data.slice(offset_shift, offset_shift + 16));
      let [hex, ascii] = this.array_to_hex(data_chunk); 
      let current_offset_hex = this.offset_to_hex(remote_offset + offset_shift); 
      hex_table.push(hex);
      ascii_table.push(ascii);
      offset_table.push(current_offset_hex);
      offset_shift += 16;
    }
    return ([offset_table, hex_table, ascii_table]);
  }

  offset_to_hex(offset)
  {
    //if do by group of 4
    let pad = '';
    let hex = offset.toString('16');
    let padding = 4 - hex.length;

    for (let i = 0; i < padding; i++)
    {
      pad += '0';
    }

    return (pad + hex);
  }

  array_to_hex(array)
  {
    let hex = "";
    let ascii = "";
    for (let i = 0; i < array.length; i++) 
    {
      let c = array[i];
      if (i !== 0)
      {
        hex += ' ' 
      }
      if (c < 16)
      {
        hex += '0'
      }
      hex += c.toString(16);

      if ((c >= 32) && (c <= 126)) 
      {
        ascii += String.fromCharCode(c); 
      }
      else 
      {
        ascii += '.'; 
      }
    }
    return [hex, ascii];
  }

  render()
  {
    return (
       <regular-table id={"regular-table-" + this.table_id} style={{ fontWeight: "bold", fontFamily : "Monospace", "scrollbarColor" : "inherit", "scrollbarWidth" : "inherit"}}>
       </regular-table>
    );
  }
}
