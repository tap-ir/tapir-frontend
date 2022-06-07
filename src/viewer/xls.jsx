import { TapirAPI } from "./../login.js";

import React from "react";

import { Table, Spin, Tabs } from 'antd';
import XLSX from 'xlsx';

const { TabPane } = Tabs;

const MAX_FILE_SIZE = 100*1024*1024;

//add extraction of vba & show user info
export default class XlsViewer  extends React.Component 
{
  constructor(props)
  {
    super(props);
    this.api = TapirAPI();
    this.state = {workbook : null};
    //this.csv = null;
  }

  componentDidMount() 
  {
    this.parseXls();
  }

  componentDidUpdate(prevProps) 
  {
    if (prevProps.node_id !== this.props.node_id)
    {
      this.parseXls();
    }
  }

  parseXls()
  {
    if (this.props.fileSize <= MAX_FILE_SIZE)
    {
      this.setState({workbook : null});
      this.getData(this.props.node_id).then(data =>
      {
        let workbook = XLSX.read(data);
        let sheets = []
        for (const name of workbook.SheetNames)
        {
          let json = XLSX.utils.sheet_to_json(workbook.Sheets[name], { raw: true, defval : null }); 
          if (json.length > 0)
          {
            let columns = [];
            for (const key of Object.keys(json[0]))
            {
              columns.push({title : key, dataIndex : key});
            }
            sheets.push({name : name, data :  json, columns : columns});
          }
        }
        //if len(sheets);
        this.setState({workbook : sheets});
      })
    }
  }

  async getData(node_id)
  {
    let response = await this.api.download(this.props.node_id);
    let array = await response.data.arrayBuffer();
    return (array);
  }

  render() 
  {
    if (this.props.fileSize > MAX_FILE_SIZE)
    {
      return (<div style={{color : 'white', textAlign : 'center', paddingTop : 100, paddingBottom : 100}}>File is too big to be displayed : {this.props.fileSize}</div>);
    }

    if (this.state.workbook === null)
    {
      return (
        <div style={{ textAlign : 'center', paddingTop: 100, paddingBottom : 100  }}>
          <Spin tip="Loading"/> 
        </div>
      );
    }
    else
    {
      //XXX show props author etc ... can be useful 
      let index = -1;
      return ( 
        <>
          <Tabs style={{color : "white"}} defaultActiveKey="1">
          {
            this.state.workbook.map((sheet) => 
            {
              index += 1;

              return ( 
                <TabPane tab={sheet.name} key={index}>
                  <Table columns={sheet.columns} 
                    dataSource={sheet.data} 
                    pagination={{defaultPageSize : 100, simple : true, position : ['topRight', 'bottomRight']}}
                  />
                </TabPane>
              )
            })
          }
          </Tabs>
        </>
      );
    }
  }
}


