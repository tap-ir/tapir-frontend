import React from "react";
import { Table } from 'antd';
import { PLUGINS_CONFIG } from "./utils/plugins.jsx";

export default class Plugins extends React.Component 
{
  constructor(props) 
  {
    super(props);
    this.columns = [
      {
        title : 'Name',
        dataIndex: 'name',
        width : 30,
      },
      {
        title : 'Category',
        dataIndex: 'category',
        width : 30,
      },
      {
        title : 'Description',
        dataIndex: 'description',
        width : 200,
      },
      //{
        //title : 'Configuration',
        //dataIndex : 'config',
        //width : 200,
      //},
    ];
    this.state = { isLoading: false, plugins : null };
  }

  componentDidMount() 
  {
    this.setState({isLoading : true});
    PLUGINS_CONFIG.then(plugins_config => 
    {
      let plugins = [];
      let i = 0;
      for (const name in plugins_config)
      {
        let config = plugins_config[name];
        plugins.push({key : i, name : name, category : config.category, description : config.description });
        i += 1;
      };
      this.setState({ isLoading : false, plugins : plugins });
    });
  }

  render() 
  {
      const { isLoading, plugins } = this.state;

      return (
        <Table
           className="table"
           rowKey={record => record.key}
           columns={this.columns}
           dataSource={plugins}
           showHeader={true}
           sticky={true}
           loading={isLoading}
           pagination={false}
        />)
  }
}
