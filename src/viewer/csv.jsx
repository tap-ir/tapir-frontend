import { TapirAPI } from "./../login.js";

import React from "react";
import { Table, Spin } from 'antd';

import Papa from 'papaparse';

const MAX_FILE_SIZE = 400*1024*1024;

export default class CsvViewer  extends React.Component 
{
  constructor(props)
  {
    super(props);
    this.api = TapirAPI();
    this.state = ({completed : false});
    this.csv = null;
  }

  componentDidMount() 
  {
    this.parseCsv();
  }

  componentDidUpdate(prevProps) 
  {
    if (prevProps.fileUrl !== this.props.fileUrl)
    {
      this.parseCsv();
    }
  }

  parseCsv()
  {
    if (this.props.fileSize <= MAX_FILE_SIZE)
    {
      this.csv = [];
      Papa.parse(this.props.fileUrl, 
      {
        download : true,
        //if file size > xxx
        //can optimize by not using worker for small file
        worker: true,
        step: this.addRow.bind(this), 
        complete: this.parsingDone.bind(this),
      });
    }
  }

  addRow(row)
  {
    //add key row number ?
    this.csv.push(row.data);
  }

  parsingDone()
  {
    this.setState({completed : true});
  }

  render() 
  {
    if (this.props.fileSize > MAX_FILE_SIZE)
    {
      return (<div style={{color : 'white', textAlign : 'center', paddingTop : 100, paddingBottom : 100}}>File is too big to be displayed : {this.props.fileSize}</div>);
    }

    if (this.state.completed === false)
    {
      return (
        <div id="csv" style={{ textAlign : 'center', paddingTop: 100, paddingBottom : 100  }}>
          <Spin tip="Loading"/> 
        </div>
      );
    }
    else
    {
      let csvColumns = this.csv.shift();
      let columns = [];
      for (let i = 0; i < csvColumns.length; i++)
      {
        columns.push({title : csvColumns[i], dataIndex : i });
      }

      return (
        <>
          <Table columns={columns} 
                 dataSource={this.csv} 
                 pagination={{defaultPageSize : 100, simple : true, position : ['topRight', 'bottomRight']}}
          />
        </>
      );
    }
  }
}


