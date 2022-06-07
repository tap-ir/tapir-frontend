import { PLUGINS_CONFIG } from "../utils/plugins.jsx";

import React from "react";
import { Menu, Item, theme, Submenu } from "react-contexify";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDownload, faFolder, faCopy, faPlus, faCog } from '@fortawesome/free-solid-svg-icons'
import { faEye, faFilePdf, faFileImage, faFileVideo, faFileWord, faFileExcel} from '@fortawesome/free-solid-svg-icons';
import { FileTextOutlined, FieldBinaryOutlined } from '@ant-design/icons';

import 'react-contexify/dist/ReactContexify.css';

export const TABLE_CONTEXT_MENU_ID="TableContext";

export class ContextMenuItem extends React.Component
{
  //animation must be null or it loose input when opening new widget 
  constructor(props)
  {
    super(props);
    this.state = { plugins_item : null};
  }

  componentDidMount()
  {
    PLUGINS_CONFIG.then(plugins => 
    {
      let category_plugins_item = {};

      for (const name in plugins)
      {
        let category = plugins[name].category;
        let item = <Item key={name} id={"Plugin/" + name} onClick={this.props.onClick} >
                  {name} 
                </Item>;
        if (category_plugins_item[category])
          category_plugins_item[category].push(item);
        else
          category_plugins_item[category] =[item];
      }

      let categories = Object.keys(category_plugins_item).sort().map((name, items) => {
        return (<Submenu key={name} label={name} >
                  {category_plugins_item[name]}
                </Submenu>);
      });

      this.setState({plugins_category : categories});
    });
  }

  render()
  {

  return(
    <Menu 
      id={TABLE_CONTEXT_MENU_ID + this.props.browser_id}
      theme={theme.dark}
      animation={null}
    >
      <Item id={"Open"} onClick={this.props.onClick} >
        <FontAwesomeIcon icon={faFolder} />&nbsp;&nbsp;Open in new browser
      </Item>

      <Submenu label={<><FontAwesomeIcon icon={faCopy} />&nbsp;&nbsp;Copy</>} >
        <Item id={"Copy"} onClick={this.props.onClick} >
          <FontAwesomeIcon icon={faCopy} />&nbsp;&nbsp;file path
        </Item>
        <Item id={"CopyText"} onClick={this.props.onClick} >
          <FontAwesomeIcon icon={faCopy} />&nbsp;&nbsp;selected text
        </Item>
      </Submenu>
      <Submenu label={<><FontAwesomeIcon icon={faCog} />&nbsp;&nbsp;Plugins</>} >
        {this.state.plugins_category}
      </Submenu>
      <Submenu label={<><FontAwesomeIcon icon={faEye} />&nbsp;&nbsp;Viewer</>} >
        <Item id={"Viewer/hex"} onClick={this.props.onClick} >
          <FieldBinaryOutlined />&nbsp;&nbsp;Hex
        </Item>
        <Item id={"Viewer/text"} onClick={this.props.onClick} >
          <FileTextOutlined />&nbsp;&nbsp;Text
        </Item>
        <Item id={"Viewer/application/pdf"} onClick={this.props.onClick} >
          &nbsp;<FontAwesomeIcon icon={faFilePdf} />&nbsp;&nbsp;PDF
        </Item>
        <Item id={"Viewer/image"} onClick={this.props.onClick} >
          &nbsp;<FontAwesomeIcon icon={faFileImage} />&nbsp;&nbsp;Image
        </Item>
        <Item id={"Viewer/video/mp4"} onClick={this.props.onClick} >
          &nbsp;<FontAwesomeIcon icon={faFileVideo} />&nbsp;&nbsp;Video
        </Item>
        <Item id={"Viewer/application/docx"} onClick={this.props.onClick} >
          &nbsp;<FontAwesomeIcon icon={faFileWord} />&nbsp;&nbsp;Docx
        </Item>
        <Item id={"Viewer/application/xls"} onClick={this.props.onClick} >
          &nbsp;<FontAwesomeIcon icon={faFileExcel} />&nbsp;&nbsp;Xls
        </Item>
        <Item id={"Viewer/application/csv"} onClick={this.props.onClick} >
          &nbsp;<FontAwesomeIcon icon={faFileExcel} />&nbsp;&nbsp;CSV
        </Item>
      </Submenu>
      <Item id={"Download"} onClick={this.props.onClick} >
        <FontAwesomeIcon icon={faDownload} />&nbsp;&nbsp;Download
      </Item>
      <Item id={"AddAttribute"} onClick={this.props.onClick} >
        <FontAwesomeIcon icon={faPlus} />&nbsp;&nbsp;Add attribute
      </Item>
    </Menu>);
  }
}

export default ContextMenuItem;
