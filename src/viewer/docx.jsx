import { TapirAPI } from "./../login.js";

import React from "react";
import { Spin } from 'antd';

import mammoth from 'mammoth/mammoth.browser';

const MAX_FILE_SIZE = 100*1024*1024;

export default class DocxViewer  extends React.Component 
{
  constructor(props)
  {
    super(props);
    this.api = TapirAPI();
  }

  render() 
  {
    if (this.props.fileSize >= MAX_FILE_SIZE)
    {
      return (<div style={{color : 'white', textAlign : 'center', paddingTop : 100, paddingBottom : 100}}>File is too big to be displayed : {this.props.fileSize}</div>);
    }

    this.api.download(this.props.node_id).then(response =>
    {
      mammoth.convertToHtml(
          { arrayBuffer: response.data },
          { includeDefaultStyleMap: true },
      ).then((result) => 
        {
          const docEl = document.createElement('div');
          docEl.className = 'document-container';
          docEl.innerHTML = result.value;
          document.getElementById('docx').innerHTML = docEl.outerHTML;
        })
        .catch((error) => 
        {
          console.log('error converting docx ', error);
        })
        .done();
    });

    return (
      <div id="docx" style={{ textAlign : 'center', paddingTop: 100, paddingBottom : 100}}>
        <Spin tip="Loading"/> 
      </div>
    );
  }
}
