import eventBus from '../utils/eventbus.js';
import clipboardCopy from '../utils/clipboard.jsx';
import { TapirAPI } from "../login.js";

import React from "react";
import TreeTable from 'react-antd-treetable';

import { Menu, Item, animation, theme, contextMenu } from 'react-contexify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCopy, faColumns } from '@fortawesome/free-solid-svg-icons'

const TREE_CONTEXT_MENU_ID="AttributesTreeContext";

function AttributesTreeContextMenu(props) 
{
  return (
    <Menu 
      id={TREE_CONTEXT_MENU_ID + props.browser_id}
      theme={theme.dark}
      animation={animation.scale}
    >
      <Item id={'CopyValue'} onClick={props.onClick}>
         <FontAwesomeIcon icon={faCopy} />&nbsp;&nbsp;Copy value
      </Item>
      <Item id={'CopyAttribute'} onClick={props.onClick}>
         <FontAwesomeIcon icon={faCopy} />&nbsp;&nbsp;Copy attribute
      </Item>
      <Item id={'CopyAttributeValue'} onClick={props.onClick}>
         <FontAwesomeIcon icon={faCopy} />&nbsp;&nbsp;Copy attribute and value
      </Item>
      <Item id={'CopyText'} onClick={props.onClick}>
         <FontAwesomeIcon icon={faCopy} />&nbsp;&nbsp;Copy selected text 
      </Item>
      { props.addColumn && (
        <Item id={'AddColumn'} onClick={props.onClick}>
          <FontAwesomeIcon icon={faColumns} />&nbsp;&nbsp;Add as column
        </Item>)
      }
    </Menu>);
}

const columns = [
  {
    title: 'Attribute',
    dataIndex: 'attribute',
  },
  {
    title: 'Value',
    dataIndex: 'value',
  },
];

export default class AttributesTree extends React.Component
{
  constructor(props)
  {
    super(props);
    this.api = TapirAPI();
    this.state = { data : [] };
  }

  componentDidMount() 
  {
    eventBus.on("nodeclick" + this.props.browser_id, this.onNodeClicked.bind(this))
    eventBus.on("nodeclick_id" + this.props.browser_id, this.onNodeClickedId.bind(this))
  }

  onNodeClickedId(node_id)
  {
    this.api.node_by_id(node_id, false, false, true, false).then(response =>
    {
      if (response)
       this.onNodeClicked(response.data.attributes);
    });
  }

  onNodeClicked(attributes)
  {
    let data = this.attributesToTree(attributes);
    this.setState({data : data });
  }

  componentWillUnmount() 
  {
    eventBus.remove("nodeclick" + this.props.browser_id);
    eventBus.remove("nodeclick_id" + this.props.browser_id);
  }

  attributesToTree(attributes)
  {
    let data = [];
    let id = 0; 
    this.parseObjectProperties(attributes, data, id);
    return data;
  }

  parseObjectProperties(obj, data, id) 
  {
    for (var k in obj) 
    {
      id += 1;
      if (typeof obj[k] === 'object' && obj[k] !== null) 
      {
        let attr = {id : id.toString(), attribute : k, value : "", children : []};
        data.push(attr);
        id = this.parseObjectProperties(obj[k], attr["children"], id)
      } 
      else if (obj.hasOwnProperty(k)) 
      {
        if (obj[k])
        {
          data.push({ id : id.toString(), attribute : k, value : obj[k].toString() });
        }
        else
        {
          data.push({ id : id.toString(), attribute : k, value : "" });
        }
      }
    }
    return id;
  }

  attributePathRec(full, row)
  {
    if (row.__react_antd_treetable_parent)
    {
      let parent_row = row.__react_antd_treetable_parent;
      full = parent_row.attribute + '.' + full;
      return (this.attributePathRec(full, parent_row));
    }
    return (full);
  }

  contextMenuClicked(args)
  {
    let id = args.event.currentTarget.id;

    let row = args.props.selectedRow;
    if (id === "CopyAttribute")
    {
      clipboardCopy(this.attributePathRec(row.attribute, row));
    }
    else if (id === "CopyValue")
    {
      clipboardCopy(row.value);
    }
    else if (id === "CopyAttributeValue")
    {
      clipboardCopy(this.attributePathRec(row.attribute, row) + " : " + row.value);
    }
    else if (id === "CopyText")
    {
      let text = document.getSelection();
      clipboardCopy(text);
    }
    else if (id === "AddColumn")
    {
      let attribute = this.attributePathRec(row.attribute, row);
      eventBus.dispatch("addColumn" + this.props.browser_id, 'attributes.' + attribute);
    }
  }

  render()
  {
    return (
    <>
      <TreeTable className="table"
        rowKey="id" 
        dataSource={this.state.data} 
        expandable={{ defaultExpandAllRows: true, }}
        columns={columns}
        onRow={(record, rowIndex) => 
        {
          return { 
            onContextMenu: e =>
            {
              contextMenu.show({ id: TREE_CONTEXT_MENU_ID + this.props.browser_id, event: e, props : { selectedRow : record }});
            },
          };
        }}
        //scroll = {{ x : true}}
      />
      <AttributesTreeContextMenu addColumn={this.props.addColumn} onClick={this.contextMenuClicked.bind(this)} browser_id={this.props.browser_id} />
    </>)
  }
}

