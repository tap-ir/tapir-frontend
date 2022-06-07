import eventBus from '../utils/eventbus.js';
import { TapirAPI } from "../login.js"; 

import { ExportMenu, ExportConfig } from "../table/export.jsx";
import { MAX_PAGE_ROWS } from "../table/nodestable.jsx";

import React from "react";

import { Input, Button, Pagination } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHome, faArrowLeft, faColumns } from '@fortawesome/free-solid-svg-icons'

export default class BrowserToolbar extends React.Component 
{
 
  constructor(props)
  {
    super(props);
    this.api = TapirAPI();
    this.state = { current_path : "/root", 
                   isExportConfigVisible : false,
                   currentPage : 1, 
                   result : null, 
                 };
    this.exportType = null;
  }

  componentDidMount()
  {
    eventBus.on("dirchanged" + this.props.browser_id, this.updateInput.bind(this));
    eventBus.on("paginate" + this.props.browser_id, this.onPaginate.bind(this))
  }

  componentWillUnmount() 
  {
    eventBus.remove("dirchanged" + this.props.browser_id);
    eventBus.remove("paginate" + this.props.browser_id);
  }

  /**
   *  Columns 
   */
  clickColumns = () => {  eventBus.dispatch("toolbarclick" + this.props.browser_id, "columns") } 

  /**
   *  Pagination
   */
  pageChanged = (page) => 
  { 
    eventBus.dispatch("pageChanged" + this.props.browser_id, page) 
    this.setState({currentPage : page});
  } 

  onPaginate(count)
  {
    this.setState({result : count, currentPage : 1});   
  }

  /**
   *  Path input
   */
  clickBackward = () => 
  { 
    eventBus.dispatch("toolbarclick" + this.props.browser_id, "back") 
  } 

  clickHome  = () => 
  { 
    eventBus.dispatch("toolbarclick" + this.props.browser_id, "home") 
  } 
  
  enterInput = (e) => 
  { 
    eventBus.dispatch("changedirbypath" + this.props.browser_id, e.target.value) 
  }

  updateInput(node_id)
  {
    this.api.node_path(node_id).then(response => 
    {
      if (response)
      {
        this.setState({current_path : response.data});
      }
    });
  }

  changeInput(e) 
  {
    this.setState({current_path : e.target.value});  
  }

  /*
   *  Export
   */
  exportClicked(event)
  {
    this.exportType = event.key;
    this.setState({isExportConfigVisible : true});
  }

  exportConfigOk(config)
  {
    eventBus.dispatch("export" + this.props.browser_id, config)
    this.setState({isExportConfigVisible : false});
  }

  exportConfigCancel()
  {
    this.setState({isExportConfigVisible : false});
  }

  /**
   *  Render
   */
  render() 
  {
    //let result_info = null;
    let paginate = null;

    if (this.state.result && this.state.result > MAX_PAGE_ROWS)
    {
      //result_info = <div style={{whiteSpace : "nowrap"}}> &nbsp; Files : {this.state.result}</div>
      //result_info = <Button>Found : {this.state.result}</Button>

      paginate =  <Pagination simple current={this.state.currentPage} total={this.state.result} pageSize={MAX_PAGE_ROWS} size={"small"} onChange={this.pageChanged} style={{"marginLeft" : "auto"}} />
    }

    return (
      <div className="toolbar" > 
        <Button title="Go to parent directory" onClick={this.clickBackward} icon={<FontAwesomeIcon icon={faArrowLeft} />} />
        <Button title="Go to root" onClick={this.clickHome} icon={<FontAwesomeIcon icon={faHome} />} />
        <Input value={this.state.current_path} onPressEnter={this.enterInput} onChange={this.changeInput.bind(this)} />
        <Button title="Edit columns" icon={<FontAwesomeIcon onClick={this.clickColumns} icon={faColumns} />} />
        &nbsp;&nbsp;&nbsp;&nbsp;
        <ExportMenu onClick={this.exportClicked.bind(this)} />
        <ExportConfig
          visible={this.state.isExportConfigVisible} 
          onOk={this.exportConfigOk.bind(this)}
          onCancel={this.exportConfigCancel.bind(this)}
          exportType={this.exportType}
          browser_id={this.props.browser_id}
        />
        {/*{result_info}*/}
        {paginate}
      </div>
    )
  }
}
