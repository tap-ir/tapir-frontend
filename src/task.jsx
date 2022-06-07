import React from "react";
import { TapirAPI } from "./login.js";
import { PLUGINS_CONFIG } from "./utils/plugins.jsx";
import { notifyError } from "./utils/notification";
import { nextGridIndex } from './frontend.jsx'; 

import { Table, Input, Button, Space, Modal } from 'antd';
import { ResizableTitle, sort_attribute } from "./table/nodestable.jsx";
import { SearchOutlined } from '@ant-design/icons';
import { VList } from 'virtual-table-ant-design';
import { withSize } from 'react-sizeme';
import Highlighter from 'react-highlight-words';
import _ from 'lodash';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';

const MAX_PAGE_ROWS = 2000; 
const UPDATE_INTERVAL = 10000;

class TaskComponent extends React.Component
{
  constructor(props) 
  {
    super(props);

    let columns = [
      {
        title : 'PID',
        dataIndex: 'id',
        width : 20,
        sorter : (a, b) => sort_attribute('id', a, b),
        ...this.getColumnSearchProps('id'),
      },
      {
        title : 'Status',
        dataIndex: 'state',
        width : 30,
        sorter : (a, b) => sort_attribute('state', a, b),
        ...this.getColumnSearchProps('state'),
      },
      {
        title : 'Plugin',
        dataIndex: 'plugin',
        width : 30,
        sorter : (a, b) => sort_attribute('plugin', a, b),
        ...this.getColumnSearchProps('plugin'),
      },
      {
        title : 'Argument',
        dataIndex: 'command',
        width : 300,
        ...this.getColumnSearchProps('command'),
      },
      {
        title : 'Result',
        width : 15,
        filters : [
          { text : 'Ok', value : 'result' },
          { text : 'Error', value : 'error' },
        ],
        onFilter : (value, record) => record[value],
        render : (_, record) =>
        {
          //div center + button 
          if (record.result)
            return (<div style={{ textAlign : 'center'}}><FontAwesomeIcon icon={faCheck} fixedWidth /></div>);
          if (record.error)
            return (<div style={{ textAlign : 'center'}}><FontAwesomeIcon icon={faTimes} fixedWidth /></div>);
        }
      }
    ];

    this.api = TapirAPI();
    this.plugins_config = null;
    this.tasks = {};
    this.state = { isLoading: true, columns : columns, data : [], 
                   isResultVisible : false, currentResult : null, currentError : null};
  }

  componentDidMount() 
  { 
    this.setState({isLoading : true});
    this.updateTasks();
  }

  /**
   *  Table path is clickable to open a new browser
   */
  pathClicked(e)
  {
    //parentElement parentNode offsetParent ?
    let path = e.target.parentElement.title;
    this.api.parent_id_by_path(path).then(response => 
    {
      this.props.layout.layout.addTabToActiveTabSet( 
      {
          component: "browser",
          name: "Browser " + nextGridIndex(),
          config: { node_id : response.data }
      });
    }).catch(error => 
    {
      console.log('Error opening link :', path);
    });
  }

  /**
   *  Get and update task periodically
   */
  updateTasks()
  {
    this.getNewTasks().then(update => 
    {
      if (update)
      {
        this.setAllTasks();
      }
      if (this.timer);
        clearTimeout(this.timer);
      this.timer = setTimeout(this.updateTasks.bind(this), UPDATE_INTERVAL);
    });
  }

  //update all tasks, could just update some of them ?
  setAllTasks()
  {
    let data = [];

    //XXX copy only new tasks it will be lot faster 
    let tasks_count = Object.keys(this.tasks).length;
    for (let i = 1; i <= tasks_count; i++)
    {
      data.push(this.tasks[i]);    
    }
    this.setState({ isLoading : false, data : data });
  }

  async getNewTasks()
  {
    if (this.plugins_config === null)
    {
      this.plugins_config = await PLUGINS_CONFIG; 
    }

    let response = await this.api.task_count();
    let task_count = response.data;

    let task_ids = [];
    //we check this one before as new task could be in not finished tasks
    //we iterate each time, keep differnt list for finished / unfinished
    //so we don't iterate all tasks ?
    let tasks_count = Object.keys(this.tasks).length;
    for (let id = 1; id < tasks_count; id++)
    {
      if (this.tasks[id].state !== "finished")
      {
        task_ids.push(id);
      }
    }

    for (let id = tasks_count; id < task_count; id++)
    {
      task_ids.push(id+1);
    }
    if (task_ids.length === 0)
      return false

    response = await this.api.tasks(task_ids);
    let tasks = response.data;

    for (const task of tasks)
    {
      this.tasks[task.id] = task;
    }

    let nodes_path = await this.tasksNodesPath(tasks);
    await this.tasksToCommandline(tasks, nodes_path);

    return true;
  }


  /**
   * Task argument to command line string conversion
   */
  async tasksNodesPath(tasks)
  {
    let nodes_id = [];
    for (let i = 0; i < tasks.length; i++)
    {
      let task = tasks[i];
      let config = this.plugins_config[task.plugin];
      if (config)
      {
        await this.argumentNodesId(task.argument, config, nodes_id);
      }
    }
  
    let response = await this.api.nodes_by_id(nodes_id, true, true, false, false)
    .catch(error => 
    {
      notifyError('Tasks error', "" + error);
      let response = {};
      response.data = [];
      return response;
    });
    let nodes_path = {};
    for (let node of response.data)
    {
      nodes_path[node.id.index1] = <Button title={node.path} className='linkButton' key={node.id.index1} onClick={this.pathClicked.bind(this)} style={{color : "gray"}} type="text">{node.name}</Button>; 
    }

    return nodes_path;
  }

  async argumentNodesId(task_arguments, config, nodes_id)
  {
    let args = config.arguments;
    for (const arg_name in args) //must iterate task_arguments rather than config so we parse only the one that are requiered or given not all of them and we don't have undef in the last else 
    {
      let argument = args[arg_name];
      
      if (argument.type === "NodeId")
      {
        let node_id = task_arguments[arg_name];
        if (node_id)
          nodes_id.push(node_id);
      }
      else if (argument.type === "AttributePath")
      {
        let node_id = task_arguments[arg_name].node_id;
        if (node_id)
          nodes_id.push(node_id);
      }
      else if (argument.type === "array" && argument.subtype === "NodeId")
      {
        let argument = task_arguments[arg_name];
        //just need to merge
        for (const node_id of argument)
        {
          nodes_id.push(node_id);
        }
      }
    }
  }

  async tasksToCommandline(tasks, nodes_path)
  {
    for (let i = 0; i < tasks.length; i++)
    {
      let task = tasks[i];
      let config = this.plugins_config[task.plugin];
      if (config)
      {
        
        task.command = await this.argumentToCommandLine(task.argument, config, nodes_path);
        task.argument = null; //this should free a bit of memory as it's unused now;
      }
    }
  }

  async argumentToCommandLine(task_arguments, config, nodes_path)
  {
    let command_line = [];
    let args = config.arguments;
    for (const arg_name in args) //must iterate task_arguments rather than config so we parse only the one that are requiered or given not all of them and we don't have undef in the last else 
    {
      let argument = args[arg_name];
     
      //create button here ?
      if (argument.type === "NodeId")
      {
        let node_id = task_arguments[arg_name];
        let path = ""
        if (node_id)
          path = nodes_path[node_id.index1]; 
        command_line.push(<>--{arg_name}&nbsp;{path}</>);
      }
      else if (argument.type === "AttributePath")
      {
        let node_id = task_arguments[arg_name].node_id;
        //let attribute_name = task_arguments[arg_name].attribute_name;
        let path = "";
        if (node_id)
          path = nodes_path[node_id.index1]; 
        //we don't display with : notation
        command_line.push(<>--{arg_name}&nbsp{path}</>);//+ ':' + attribute_name;
      }
      else if (argument.type === "array" && argument.subtype === "NodeId")
      {
        let argument = task_arguments[arg_name];
        command_line.push(<>--{arg_name}&nbsp;</>);
        let previous = false;
        for (const node_id of argument)
        {
          if (previous)
            command_line.push(<>,&nbsp;</>);
          else
            previous = true;
          if (node_id)
          {
            let path = nodes_path[node_id.index1];
            command_line.push(<>{path}&nbsp;</>);
          }
        }
      }
      else
      {
        let arg = task_arguments[arg_name];
        if (arg)
        {
          if (typeof(arg) === "object")
          {
            let arg_cmd = "";
            for (const arg_name in arg)
            {
              //should be recursive arg[arg_name] can be array, object ...
              arg_cmd += arg_name + ':"' + arg[arg_name] + '",';
            }

            command_line.push(<>--{arg_name}&nbsp;{arg_cmd}&nbsp;</>); 
          }
          else
          {
            command_line.push(<>--{arg_name}&nbsp;{arg}&nbsp;</>);
          }
        }
        else
          command_line.push(<>--{arg_name}&nbsp;</>);
      }
    }
    
    return (command_line);
  }

  /** 
   *  Column resizing
   **/
  handleResize = index => (e, { size }) => 
  {
    this.setState(({ columns }) => 
    {
      const nextColumns = [...columns];
      nextColumns[index] = 
      {
        ...nextColumns[index],
        width: size.width,
      };
      return { columns: nextColumns };
    });
  };

  onResizeStart = (e, data) => {
    e.stopPropagation()
    e.preventDefault()
  }

  /**
   *  Search and filter
   */
  getColumnSearchProps = dataIndex => 
  ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => 
    (
      <div style={{ padding: 8 }}>
        <Input
          ref={node => {
            this.searchInput = node;
          }}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => this.handleSearch(selectedKeys, confirm, dataIndex)}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => this.handleSearch(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Search
          </Button>
          <Button onClick={() => this.handleReset(clearFilters, selectedKeys, confirm, dataIndex)} size="small" style={{ width: 90 }}>
            Reset
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => {
              confirm({ closeDropdown: false });
              this.setState({
                searchText: selectedKeys[0],
                searchedColumn: dataIndex,
              });
            }}
          >
            Filter
          </Button>
        </Space>
      </div>
    ),

    filterIcon: filtered => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,

    //we use loadsh to search on record recusively for index
    onFilter: (value, record) =>
      _.get(record, dataIndex)
        ? _.get(record, dataIndex).toString().toLowerCase().includes(value.toLowerCase())
        : '',

    onFilterDropdownVisibleChange: visible => 
    {
      if (visible) {
        setTimeout(() => this.searchInput.select(), 100);
      }
    },

    render: (text, rowIndex)  =>
    {
      if (this.state.searchedColumn === dataIndex)
      {
          return <Highlighter
            highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
            searchWords={[this.state.searchText]}
            autoEscape
            textToHighlight={text ? text.toString() : ''}
          />
      }
      return text
    }
  });

  handleSearch = (selectedKeys, confirm, dataIndex) => 
  {
    confirm();
    this.setState({
      searchText: selectedKeys[0],
      searchedColumn: dataIndex,
    });
  };

  handleReset = (clearFilters, selectedKeys, confirm, dataIndex) => 
  {
    clearFilters();
    confirm();
    this.setState({ searchText: '',
      searchedColumn :dataIndex,
    });
  };

  /**
   *  Render table
   */
  onDoubleClick(record, rowIndex, event)
  {
    this.setState({isResultVisible : true, currentResult : record.result, currentError : record.error})
  }

  onResultCancel()
  {
    this.setState({isResultVisible : false});
  }

  render() 
  {
    let components = null;
    let pagination = false;

    const columns = this.state.columns.map((col, index) => ({
      ...col,
      onHeaderCell: column => 
      ({
        width: column.width,
        onResize: this.handleResize(index),
        onResizeStart: this.onResizeStart,
      }),
    }));
   
    if (this.state.data.length > 100)
    {
      components = VList({ x : false, height: this.props.size.height });
      if (this.state.data.length > MAX_PAGE_ROWS)
        pagination ={ pageSize : MAX_PAGE_ROWS, simple : true, position : ["topLeft"] }
      components["header"] = { cell: ResizableTitle, };
    }
    else
    {
      components = { header: { cell: ResizableTitle, }, };
    }

    return (
      <>
        <Table
           className="table"
           rowKey={record => record.id}
           columns={columns}
           dataSource={this.state.data}
           showHeader={true}
           sticky={true}
           loading={this.state.isLoading}
           pagination={pagination}
           components={components}
           onRow={(record, rowIndex) =>
           {
             let clickEvent = 
             {
               onDoubleClick : event =>
               {
                 this.onDoubleClick(record, rowIndex, event);
               }
             };
             return clickEvent;
           }}
        />
        <Modal title={'result'} visible={this.state.isResultVisible} onOk={this.onResultCancel.bind(this)} onCancel={this.onResultCancel.bind(this)} >
          <div>{this.state.currentResult}</div>
          <div>{this.state.currentError}</div>
        </Modal>
      </>
      );
  }
}

export default withSize({ monitorHeight: true })(TaskComponent);
