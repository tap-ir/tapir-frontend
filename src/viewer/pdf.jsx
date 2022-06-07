import React from "react";
import { Pagination, Spin } from 'antd';

import { Document, Page } from 'react-pdf/dist/esm/entry.webpack';

const MAX_FILE_SIZE = 100*1024*1024;

export default class PdfViewer extends React.Component
{
  constructor(props)
  {
    super(props);
    this.state = { pageCount : null, currentPage : 1 };
  }

  onPdfLoad(info)
  {
    this.setState({pageCount : info.numPages});
  }

  onChangePage(pageNumber)
  {
    this.setState({currentPage : pageNumber});
  }

  loading()
  {
    return (
      <div style={{ textAlign : 'center', paddingTop: 100, paddingBottom : 100  }}>
        <Spin tip="Loading"/>
      </div>
    );
  }

  //rotate
  //page height / width / scale
  render()
  {
    let pagination = null;
    if (this.state.pageCount > 0)
    {
      pagination = <Pagination simple current={this.state.currentPage} total={this.state.pageCount} onChange={this.onChangePage.bind(this)} defaultPageSize={1} />
    }

    if (this.props.fileSize > MAX_FILE_SIZE)
    {
      return (<div style={{color : 'white', textAlign : 'center', paddingTop : 100, paddingBottom : 100}}>File is too big to be displayed : {this.props.fileSize}</div>);
    }

    return (
      <div>
        {pagination}            
        <Document file={this.props.fileUrl} onLoadSuccess={this.onPdfLoad.bind(this)} loading={this.loading}>
          <Page pageNumber={this.state.currentPage} />
        </Document>
      </div>
    )
  }
}

