import eventBus from '../utils/eventbus.js';
import { TapirAPI } from "../login.js";

import ImageViewer from './image.jsx';
import VideoViewer from './video.jsx';
import PdfViewer from './pdf.jsx';
import DocxViewer from './docx.jsx';
import TextViewer from './text.jsx';
import CsvViewer from './csv.jsx';
import XlsViewer from './xls.jsx';
import HexViewer from './hex.jsx';

import React from "react";
import { Menu } from "antd";
import { ReflexContainer, ReflexElement } from 'react-reflex';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash, faFilePdf, faFileImage, faFileVideo, faFileWord, faFileExcel} from '@fortawesome/free-solid-svg-icons';
import { FileTextOutlined, FieldBinaryOutlined } from '@ant-design/icons';


function SelectViewer(props)
{
  if (!props.type)
  {
    return (<HexViewer node_id={props.node_id} fileSize={props.fileSize} />);
  }

  if (props.type.startsWith('image')) 
  {
    return (<ImageViewer fileUrl={props.fileUrl} />);
  }
  else if (props.type.startsWith('video/mp4') 
               ||props.type.startsWith('audio/mpeg'))
  {
    return (<VideoViewer fileUrl={props.fileUrl} />);
  }
  else if (props.type.startsWith('application/pdf'))
  {
    return (<PdfViewer fileUrl={props.fileUrl} fileSize={props.fileSize}  />);
  }
  else if (props.type.startsWith('application/docx'))
  {
    return (<DocxViewer node_id={props.node_id} fileSize={props.fileSize} />);
  }
  else if (props.type.startsWith('text')) //or application/octet-stream ?
  {
    return (<TextViewer node_id={props.node_id} fileSize={props.fileSize} />);
  }
  else if (props.type.startsWith('application/csv'))
  {
    return (<CsvViewer fileUrl={props.fileUrl} fileSize={props.fileSize} />);
  }
  else if (props.type.startsWith('application/xls')) 
  {
    return (<XlsViewer node_id={props.node_id} fileSize={props.fileSize} />);
  }
  else
  {
    return (<HexViewer node_id={props.node_id} fileSize={props.fileSize} />);
  }
}

export default class Viewer extends React.Component
{
  constructor(props)
  {
    super(props);
    this.api = TapirAPI();
    if (props.config)
    {
      this.preview = false;
      this.state = {node_id : props.config.node_id, selected : props.config.selected, type : null, fileSize : props.config.fileSize };
    }
    else
    {
      this.preview = true;
      this.state = {node_id : null, type : null, fileSize : null, selected : "auto" };
    }
  }

  componentDidMount() 
  {
    if (this.preview)
    {
      eventBus.on("view", this.onView.bind(this))
      eventBus.on("view_id", this.onViewId.bind(this))
    }
  }

  componentWillUnmount() 
  {
    if (this.preview)
      eventBus.remove("view" + this.props.browser_id);
  }

  onViewId(node_id)
  {
    this.api.node_by_id(node_id, true, false, true, false).then(response => 
    {
      let attributes = response.data.attributes;
      if (attributes.data && attributes.data.size && attributes.datatype)
      {
        this.onView([node_id, response.data.name, attributes.datatype, attributes.data.size]);
      }
    });
  }

  extensionToType(node_name, datatype)
  {
    let file_extension = node_name.split(".").pop(); 
    let extension_type = [
      [['txt', 'htm', 'html'], 'text'],
      [['csv'],  'application/csv'],
      [['xlsx', 'xls'], 'application/xls'], //support xls, csv 
      [['jpeg', 'jpg', 'gif', 'bmp'], 'image'], //image/jpg, image/gif image/bmp
      [['pdf'], 'application/pdf'],
      [['docx'], 'application/docx'],
      [['mp4', 'webm', '3gp', 'mov', 'mpg', 'ogg'], 'video/mp4'], //3gp/webm/mov /mpeg/ogg
      [['mp3'], 'audio/mpeg'], //video/mp4
    ];

    for (const [extension, type] of extension_type)
    {
      if (extension.includes(file_extension))
      {  
        return type;
      }
    }

    return (datatype);
  }
  
  // if hex infinite size & if preview activated checks size ?
  //csv, xlsx, jpg, jpeg, gif, bmp, png, pdf, docx, mp3, mp4, webxim
  //viewer support csv, xlsx, docx, 
  onView(args)
  {
    let [node_id, node_name, type, size] = args;
    if (node_id && size) //don't 
    {
      if (type == null || type === 'application/zip' || type === 'text/plain' || type === 'application/x-ole-storage' || type === 'application/octet-stream')
      {
        type = this.extensionToType(node_name, type);
      }

      this.setState({node_id : node_id, type : type, fileSize: size});
    }
  }

  menuClicked(e)
  {
    this.setState({ selected : e.key });
  }

  render()
  {
    let viewer = null; 

    if (this.state.selected === "off")
    {
      viewer = <div style={{color : 'white', textAlign : 'center', paddingTop : 100, paddingBottom : 100}}>Display content of file is disabled (Select auto or a specific viewer to enable it)</div>;
    }
    else if (this.state.node_id)
    {
      let type = null;
      if (this.state.selected === "hex")
      {
        type = null; 
      }
      else if (this.state.selected === "auto")
      {
        type = this.state.type;
      }
      else
      {
        type = this.state.selected;
      }

      //if file_size == 0 or null ... show an error
      if (this.state.fileSize === 0)
        viewer = <div style={{color : 'white', textAlign : 'center', paddingTop : 100, paddingBottom : 100}}>Can't display file without content</div>;
      else
      {
        let fileUrl = this.api.download_url_from_id(this.state.node_id);
        viewer = <SelectViewer fileUrl={fileUrl} node_id={this.state.node_id} fileSize={this.state.fileSize} type={type} />  }
    }
    else
      viewer = <div style={{color : 'white', textAlign : 'center', paddingTop : 100, paddingBottom : 100}}>Display content of file</div>;
    
    return (
    <>
      <ReflexContainer orientation="vertical" style={{ width:"100%", height:"100%", overflow : "hidden" , background : "#222" }} windowResizeAware={true}>
        <ReflexElement >
        {viewer}
        </ReflexElement>

        <ReflexElement flex={0.10}>
          <Menu className="table" onClick={this.menuClicked.bind(this)}
           defaultSelectedKeys={['auto']}
           mode="inline">
            <Menu.Item icon=<FontAwesomeIcon icon={faEye} fixedWidth/> key="auto">Auto</Menu.Item>
            <Menu.Item icon=<FontAwesomeIcon icon={faEyeSlash} fixedWidth/> key="off">Off</Menu.Item>
            <Menu.Item icon=<FieldBinaryOutlined /> key="hex">Hex</Menu.Item>
            <Menu.Item icon=<FileTextOutlined />  key="text">Text</Menu.Item>
            <Menu.Item icon=<FontAwesomeIcon icon={faFilePdf} fixedWidth/> key="application/pdf">PDF</Menu.Item>
            <Menu.Item icon=<FontAwesomeIcon icon={faFileImage} fixedWidth/> key="image">Image</Menu.Item>
            <Menu.Item icon=<FontAwesomeIcon icon={faFileVideo} fixedWidth/> key="video/mp4">Video</Menu.Item>
            <Menu.Item icon=<FontAwesomeIcon icon={faFileWord} fixedWidth/> key="application/docx">Word</Menu.Item>
            <Menu.Item icon=<FontAwesomeIcon icon={faFileExcel} fixedWidth/> key="application/xls">Excel</Menu.Item>
            <Menu.Item icon=<FontAwesomeIcon icon={faFileExcel} fixedWidth/> key="application/csv">Csv</Menu.Item>
          </Menu>
        </ReflexElement>
      </ReflexContainer>
    </>)
  }
}
