import eventBus from '../utils/eventbus.js';
import { TapirAPI } from "../login.js";
import { nextGridIndex } from '../frontend.jsx'; 
import { TABLE_CONTEXT_MENU_ID, ContextMenuItem } from '../table/contextmenu.jsx';
import ColumnsSelection from '../table/columnsselection.jsx';
import clipboardCopy from '../utils/clipboard.jsx';
import { notifyError } from "../utils/notification";
import { exportToZip, downloadBlob, exportToJson } from '../utils/export.jsx';
import AddAttribute from '../table/addattribute.jsx';
import LaunchPlugin from '../table/launchplugin.jsx';

import React from "react";
import { Table, Input, Button, Space, message } from 'antd';
import Highlighter from 'react-highlight-words';
import { SearchOutlined, CloseOutlined } from '@ant-design/icons';
import { VList } from 'virtual-table-ant-design';
import { Resizable } from 'react-resizable';
import ReactDragListView from 'react-drag-listview';
import { contextMenu } from 'react-contexify';
import _ from 'lodash';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFolder, faFile } from '@fortawesome/free-solid-svg-icons';

export const MAX_PAGE_ROWS = 10000; 

export const ResizableTitle = props => 
{
  const { onResize, onResizeStart, width, ...restProps } = props;

  if (!width) 
  {
    return <th {...restProps} />;
  }

  return (
    <Resizable
      width={width}
      height={0}
      handle={
        <span
          className="react-resizable-handle"
          onClick={e => {
            e.stopPropagation();
          }}
        />
      }
      onResize={onResize}
      onResizeStart={onResizeStart}
      draggableOpts={{ enableUserSelectHack: false }}
    >
      <th {...restProps} />
    </Resizable>
  );
};

export function sort_attribute(attribute_path, a, b)
{
  a = _.get(a, attribute_path);
  b = _.get(b, attribute_path);

  if (a && b)
  {
    try 
    {
      return (a.localeCompare(b));
    }
    catch (error)
    {
      return (a - b);
    }
  }

  if (a)
  {
    return (1);
  }

  return (-1);
}

const DefaultColumns = [
  {
    title: 'Name',
    index: 'name',
    width: 200,
    closable : false,
  },
  {
    title: 'Size',
    index : 'attributes.data.size',
    width: 120,
    closable : true,
  },
  {
    title: 'Modified',
    index : 'attributes.ntfs.standard_information.altered_time',
    width: 160,
    closable : true
  },
  {
    title: 'Accessed',
    index : "attributes.ntfs.standard_information.accessed_time",
    width: 160,
    closable : true,
  },
  {
    title: 'Created',
    index : "attributes.ntfs.standard_information.creation_time",
    width: 160,
    closable : true,
  },
  {
    title: 'Type',
    index : "attributes.datatype",
    width: 200,
    closable : true,
  },
];

class NodesTable extends React.Component 
{
  constructor(props, columnsInfo) 
  {
    super(props);

    if (columnsInfo == null)
    {
      columnsInfo = DefaultColumns;
    }
     
    let columns = [];
    for (const colInfo of columnsInfo)
    {
      columns.push(this.createColumn(colInfo.title, colInfo.index, colInfo.width, colInfo.closable));
    }

    let selectedColumnsName = []
    this.originalColumns = [];
    
    for (const column of columns)
    {
      this.originalColumns.push(
      {
        ...column
         //...column, 
         //...this.getColumnSearchProps(column.dataIndex.join('.')) //do I need that ? we must choose [] or . but loadsh _.get work on the two anyway
      });
      selectedColumnsName.push(column.title); 
    }

    this.api = TapirAPI();
    this.state = { 
                   data: null, current_dir_id : null,
                   searchText: '', searchedColumn: '',
                   load : false, columns : this.originalColumns,
                   isModalVisible : false,
                   selectedColumnsName : selectedColumnsName,
                   currentPage : 1, selectedRowKeys : [],
                   isAttributeModalVisible : false,
                   isLaunchPluginVisible : false,
                 };
    
    this.currentNode = null;
    this.selectedPlugin = null;

    const that = this;
    this.dragProps = 
    {
      onDragEnd(fromIndex, toIndex) 
      {
        //XXX must block to move to place 0 because place 0 is only for selection
        const columns = [...that.state.columns];
        //must remove -1 becaues of selection row who is always 0
        const item = columns.splice(fromIndex -1, 1)[0];
        //must remove -1 becaues of selection row who is always 0
        columns.splice(toIndex -1, 0, item);
        that.setState({ columns });
      },
      nodeSelector: "th", //.ant-table-column-title ?
      enableScroll : true,
      scrollSpeed : 10,
      lineClassName : "drag-line",
    };             
  }

  /**
   *  Column handling
   */
  createColumn(title, index, width, closable = true, sortable = true, searchable = true)
  {
    if (closable === false) 
    {
      return (
      {
        title : title,
        originalTitle : title,
        dataIndex : index.split('.'), 
        width : width,
        sorter : (a, b) => sort_attribute(index, a, b),
        ...this.getColumnSearchProps(index),
      });
    }

    return (
    {
        title : <div style={{display : 'flex'}}>{title}<CloseOutlined title="Remove column"  style={{ display : "flex", color:"#bababa", marginLeft : "auto", alignItems : "center",  cursor : 'pointer'}} onClick={(event) => this.removeColumn(event, index) } /> </div>,
      originalTitle : title,
      dataIndex : index.split('.'), 
      width : width,
      sorter : (a, b) => sort_attribute(index, a, b),
      ...this.getColumnSearchProps(index),
    });
  }

  addColumn(attributeName)
  {
    let columns = this.originalColumns; 

    let name = attributeName.split('.').at(-1);
    name = name.charAt(0).toUpperCase() + name.slice(1);

    columns.push(this.createColumn(name, attributeName, 200));
    this.setState({ columns : columns })
  }

  removeColumn(event, dataIndex)
  {
    //this avoid to launch sort of column because of click event propagation
    event.stopPropagation();

    let columns = this.state.columns;

    //we don't want to remove the last column
    if (columns.length > 1)
    {
      for (let i = 0; i < columns.length; i++)
      {
        if (columns[i].dataIndex.join('.') === dataIndex)
        {
          columns.splice(i, 1);
          break;
        }
      }
      this.setState({ columns : columns});
    }
  }

  editColumnsOk()
  {
    let columns = [];

    for (const name of this.state.selectedColumnsName)
    {
      let col = this.originalColumns.find(x => x.title === name);
      columns.push(col);
    }

    this.setState({ isModalVisible : false, columns : columns, })
  }

  editColumnsCancel() 
  {
    this.setState({ isModalVisible : false })
  }

  onSelectedColumnsNameChanged(nextTargetKeys, direction, moveKeys)
  {
    if (direction === 'right')
    {
      nextTargetKeys = nextTargetKeys.filter(function(val){
         return (moveKeys.indexOf(val) === -1 ? true : false)
      })

      for (const key of moveKeys)
      {
        nextTargetKeys.push(key);
      }
    } 

    this.setState({selectedColumnsName : nextTargetKeys});
  }

  /**
   *  Context menu 
   */
  contextMenuClicked(args)
  {
    let id = args.event.currentTarget.id;
    let row = args.props.selectedRow;

    if (id === "Download")
    {
      let attributes = null;
      if (!row.attributes)
      {
        //handle download for timeline as their is no attributes 
        //must be changed later if we get attributes in timeline
        this.api.node_by_id(row.id, false, false, true, false).then(response => 
        {
          attributes = response.data.attributes;
          if (attributes.data && attributes.data.size)
          {
            let link = document.createElement('a');
            link.href = this.api.download_url_from_id(row.id); 
            link.download = row.name;
            link.click();
          }
          else
          {
            notifyError('Download error', 'File has no data');
          }
        });
      }
      else
      {
        attributes = row.attributes;
        if (attributes.data && attributes.data.size)
        {
          let link = document.createElement('a');
          link.href = this.api.download_url_from_id(row.id); 
          link.download = row.name;
          link.click();
        }
        else
        {
           notifyError('Download error', 'File has no data');
        }
      }
    }
    else if (id === "Open")
    {
      this.api.parent_id(row.id).then(response => 
      {
        this.props.layout.layout.addTabToActiveTabSet({
          component: "browser",
          name: "Browser " + nextGridIndex(),
          config: { node_id : response.data }
        });
      })
    }
    else if (id === "Copy")
    {
      this.copy_path(row.id);
    }
    else if (id === "CopyText")
    {
      this.copy_text(row.id);
    }
    else if (id === "AddAttribute")
    {
      this.currentNode = row;
      this.setState({isAttributeModalVisible : true})
    }
    else if (id.startsWith("Viewer/"))
    {
      let selected = id.substring(7);
      let node = row;
      let fileSize = 0;
      
      if (node.attributes === null)
      {
        this.api.node_by_id(row.id, false, false, true, false).then(response =>
        {
          let node = response.data;
          if (node.attributes && node.attributes.data && node.attributes.data.size)
          {
            fileSize = node.attributes.data.size;
          }

          this.props.layout.layout.addTabToActiveTabSet({
            component: "viewer",
            name: "Viewer " + nextGridIndex(),
            config: { node_id : node.id, fileSize : fileSize, selected : selected }
          });
        });
      }
      else
      {
        if (node.attributes && node.attributes.data && node.attributes.data.size)
        {
          fileSize = node.attributes.data.size;
        }

        this.props.layout.layout.addTabToActiveTabSet({
          component: "viewer",
          name: "Viewer " + nextGridIndex(),
          config: { node_id : node.id, fileSize : fileSize, selected : selected }
        });
      }
    }
    else if (id.startsWith("Plugin/"))
    {
      this.selectedPlugin = id.substring(7);
      this.currentNode = row; //currentNodeId = row.id ?
      this.setState({isLaunchPluginVisible : true});
    }
  }

  async copy_path(node_id)
  {
    let response = await this.api.node_by_id(node_id, false, true, false, false);
    clipboardCopy(response.data.path);
  }

  async copy_text(node_id)
  {
    let text = document.getSelection();//window.getSelection ?
    clipboardCopy(text);
  }
  /**
   *  Launch plugin
   */
  launchPluginOk(info)
  {
    this.api.schedule(info.plugin, info.args).then(response => { 
    })
    .catch(error => 
    {
      notifyError('Error', 'Error launching plugin ' + info.plugin + " : " + error.response.data);
      this.setState({ isLaunchPluginVisible : false })
    });
    this.setState({ isLaunchPluginVisible : false })
  }

  launchPluginCancel() 
  {
    this.setState({ isLaunchPluginVisible : false })
  }

  /**
   *  Add attribute
   */
  addAttributeOk(args)
  {
    let node = this.currentNode;
    this.api.add_attribute(node.id, args.name, args.value).then(response => {
      if (node.attributes)
      {
        //we added a new attribute so we must update the current node attribute
        //we do it client side because it's faster and result should be the same
        //but if it could be better to update them by requesting them from the server
        node.attributes[args.name] = args.value;
        eventBus.dispatch("nodeclick" + this.props.browser_id, node.attributes);
      }
      else
        eventBus.dispatch("view_id", node.id);
      this.setState({ isAttributeModalVisible : false })
    })
    .catch(error => 
    {
      notifyError('Error', 'Error adding attribute' + args.name);
      this.setState({ isAttributeModalVisible : false })
    });
  }

  addAttributeCancel() 
  {
    this.setState({ isAttributeModalVisible : false })
  }

  /**
   *  Selection & export
   */
  onSelectChange = selectedRowKeys => 
  {
    this.setState({ selectedRowKeys });
  };

  selectedNode()
  {
    let nodes_id  = [];
    for (const key of  this.state.selectedRowKeys)
    {
      nodes_id.push(this.state.data[key].id);
    }
    return (nodes_id);
  }

  exportSelection(args)
  {
    this.setState({load : true });

    if (args.exportType === 'SelectionJson')
    {
      let nodes_id  = [];
      for (const key of  this.state.selectedRowKeys)
      {
        nodes_id.push(this.state.data[key].id);
      }
      if (nodes_id.length > 0)
        exportToJson(nodes_id, args.config.filename);
    }
    else if (args.exportType === 'AllJson')
    {
      let nodes_id  = [];
      
      for (const record of this.state.data) 
      {
        nodes_id.push(record.id);
      }
      //this export as an array of [] json rather than 'by line' it's not the best maybe
      //and we already have data in nmemory but it avoid duplicating client side
      if (nodes_id.length > 0)
        exportToJson(nodes_id, args.config.filename);
    }
    else if (args.exportType === 'SelectionCsv')
    {
      const closeMessage = message.loading('Creating file : ' + args.config.filename,  0);
      let csv = this.exportCsvHeader();
      for (const key of this.state.selectedRowKeys)
      {
        let record = this.state.data[key];
        csv += this.rowToCsv(record);
      }
      closeMessage();
      downloadBlob(new Blob([csv], {type : "text/plain"}), args.config.filename);
    }
    else if (args.exportType === 'AllCsv')
    {
      const closeMessage = message.loading('Creating file : ' + args.config.filename,  0);
      let csv = this.exportCsvHeader();
      for (const record of this.state.data)
      {
        csv += this.rowToCsv(record);
      }
      closeMessage();
      downloadBlob(new Blob([csv], {type : "text/plain"}), args.config.filename);
    }
    else if (args.exportType === 'SelectionZip')
    {
      let records = [];
      for (const key of this.state.selectedRowKeys)
      {
        records.push(this.state.data[key]);
      }
      exportToZip(args, records);
    }
    else if (args.exportType === 'AllZip')
    {
      exportToZip(args, this.state.data);
    }
    this.setState({load : false});
  }

  exportCsvHeader()
  {
    let header = "";

    for (const column of this.state.columns)
    {
      header += '"' + column.originalTitle + '";';
    }
    header += '\n';
    return header;
  }

  rowToCsv(record)
  {
    let csv = "";
    for (const column of this.state.columns)
    {
      //try catch we never now ...
      let cell = _.get(record, column.dataIndex);
      if (cell)
        csv += '"' + cell + '";';
      else
        csv += '"";';
    }
    csv += '\n';
    return (csv);
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
      let iconName = null;
      if (dataIndex === 'name')
      {
        iconName = faFile;
        if (rowIndex.has_children)
        {
          iconName = faFolder;
        }
      }

      if (this.state.searchedColumn === dataIndex)
      {
        if (iconName)
        {
          return <div><FontAwesomeIcon icon={iconName} fixedWidth /> <Highlighter
              highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
              searchWords={[this.state.searchText]}
              autoEscape
              textToHighlight={text ? text.toString() : ''}
            /> </div>
        }
        else
        {
          return <Highlighter
            highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
            searchWords={[this.state.searchText]}
            autoEscape
            textToHighlight={text ? text.toString() : ''}
          />
        }
      }
      if (iconName)
      {
        return (<div><FontAwesomeIcon icon={iconName} fixedWidth /> {text}</div>); 
      }
      else
      {
        return text
      }
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
   *  Column resizing
   **/

  //apply directly on selected columns rather than copying ?
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

  //needed to export as CSV as we need a key to find which line was selected 
  //we must maybe pass other stuff to setData to avoid two rendering if there is an other setstate for loading or other stuff 
  setData(children)
  {
    for (let i = 0; i < children.length; i++)
    {
      children[i].key = i;
    }
    this.setState({ data : children,
                    selectedRowKeys : [],
                    currentPage : 1, 
                  });
  }

  render() 
  {
    //must add scroll x or added column will not show dynamically
    //we use a virtual table if there more than 100 elements
    let components = null;
    let pagination = false;

    const children = this.state.data;

    if (children && children.length > 100)
    {
      components = VList({ x : false, height: this.props.size.height -56});
      components["header"] = { cell: ResizableTitle, };
      pagination ={ current : this.state.currentPage, pageSize : MAX_PAGE_ROWS, style : { display : "none"} }
    }
    else
    {
      components = { header: { cell: ResizableTitle, }, };
    }
    let scroll = {  x : false, y: this.props.size.height -56};

    //XXX change to use only the column index selected in targetedColumns !
    //set first column width = 32 everytime as it's the checkbox column !
    /**
     *  Change columns size
     */
    const columns = this.state.columns.map((col, index) => ({
      ...col,
      onHeaderCell: column => 
      ({
        width: column.width,
        onResize: this.handleResize(index),
        onResizeStart: this.onResizeStart,
      }),
    }));

    const { selectedRowKeys } = this.state;

    const rowSelection = 
    {
      selectedRowKeys,
      onChange: this.onSelectChange,
    };

    return (
      <div style={{ width: '100%', height : '100%'}}>
        <ReactDragListView.DragColumn {...this.dragProps}>
          <Table
            className="table"
            rowSelection={rowSelection}
            rowKey={record => record.key }
            columns={columns} 
            dataSource={children} 
            showHeader={true} 
            pagination={pagination} 
            sticky={true} //this cause problem when adding new column 
            loading={this.state.load}
            onRow={(record, rowIndex) => 
            {
              let clickEvent = 
              {
                onClick: event => 
                {
                  if (record.attributes)
                  {
                    eventBus.dispatch("nodeclick" + this.props.browser_id, record.attributes);
                    if (record.attributes.data && record.attributes.data.size)
                    {
                      eventBus.dispatch("view", [record.id, record.name, record.attributes.datatype, record.attributes.data.size]);
                    }
                  }
                  else //this is for timeline when attributes are not fetch
                  {
                    eventBus.dispatch("nodeclick_id" + this.props.browser_id, record.id);
                    eventBus.dispatch("view_id", record.id);
                  }
                },
                onContextMenu: e => 
                {
                  contextMenu.show({ id: TABLE_CONTEXT_MENU_ID + this.props.brwoser_id, event: e, props : { selectedRow : record }});
                }, 
              };

              if (this.props.onDoubleClick === true)
              {
                clickEvent["onDoubleClick"] = event => 
                {
                  if (record.has_children)
                  {
                    this.changeDirectory(record.id);
                  }
                }
              }

              return clickEvent;
            }}
            scroll={ scroll }
            components={ components }
          />
        </ReactDragListView.DragColumn>

        <ContextMenuItem onClick={this.contextMenuClicked.bind(this)} /> 
        <ColumnsSelection 
          visible={this.state.isModalVisible} 
          onOk={this.editColumnsOk.bind(this)} 
          onCancel={this.editColumnsCancel.bind(this)} 
          dataSource={this.originalColumns} 
          targetKeys={this.state.selectedColumnsName} 
          onChange={this.onSelectedColumnsNameChanged.bind(this)} 
        />
        <AddAttribute
          browser_id={this.props.browser_id}
          visible={this.state.isAttributeModalVisible}
          onOk={this.addAttributeOk.bind(this)}
          onCancel={this.addAttributeCancel.bind(this)}
        />
        <LaunchPlugin
          browser_id={this.props.browser_id}
          plugin={this.selectedPlugin}
          visible={this.state.isLaunchPluginVisible}
          onOk={this.launchPluginOk.bind(this)}
          onCancel={this.launchPluginCancel.bind(this)}
          currentNode={this.currentNode}
          selectedNode={this.selectedNode.bind(this)}
        />
      </div>
    );
  }
}

export default NodesTable;
