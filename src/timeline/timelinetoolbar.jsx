import eventBus from '../utils/eventbus.js';
import { ExportMenu, ExportConfig } from "../table/export";
import { MAX_PAGE_ROWS } from "../table/nodestable.jsx";

import React from "react";

import { DatePicker, Button, Pagination } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSearch, faColumns} from '@fortawesome/free-solid-svg-icons'

const { RangePicker } = DatePicker;

export default class TimelineToolbar extends React.Component 
{
  constructor(props)
  {
    super(props);
    this.time = null;
    this.state = { buttonStatus : false, result : null,
                   currentPage : 1,
                   isExportConfigVisible : false,
                 };
  }

  componentDidMount() 
  {
    eventBus.on("timeline_result" + this.props.browser_id, this.onResult.bind(this))
  }

  componentWillUnmount() 
  {
    eventBus.remove("timeline_result" + this.props.browser_id);
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
    eventBus.dispatch("timeline_page" + this.props.browser_id, page) 
    this.setState({currentPage : page});
  } 

  onResult(count)
  {
     this.setState({result : count, currentPage : 1});   
  }

  /**
   *  Timeline search
   */
  clickSearch = () => 
  { 
    eventBus.dispatch("timeline_search" + this.props.browser_id, this.time) 
  } 
  
  clickOk(time) 
  { 
    if (time[1] != null)
    {
      //set search bouton
      this.time = time;
      this.setState({buttonStatus: false});
    }
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
    let result_info = null;
    let paginate = null;

    if (this.state.result)
    {
      result_info = <div style={{whiteSpace : "nowrap"}}>&nbsp; Found : {this.state.result}</div>

      if (this.state.result > MAX_PAGE_ROWS)
      {
        paginate =  <Pagination simple current={this.state.currentPage} total={this.state.result} pageSize={MAX_PAGE_ROWS} size={"small"} onChange={this.pageChanged} style={{"marginLeft": "auto"}} /> 
      }
    }
     
    return(
      <div className="toolbar" >
        <RangePicker showTime onOk={this.clickOk.bind(this)} />
        <Button disabled={this.state.buttonStatus} onClick={this.clickSearch} icon={<FontAwesomeIcon icon={faSearch} />} />
        &nbsp;&nbsp;&nbsp;&nbsp;
        <Button title="Edit columns" icon={<FontAwesomeIcon onClick={this.clickColumns} icon={faColumns} />} />
        <ExportMenu onClick={this.exportClicked.bind(this)} />
        <ExportConfig
          visible={this.state.isExportConfigVisible} 
          onOk={this.exportConfigOk.bind(this)}
          onCancel={this.exportConfigCancel.bind(this)}
          exportType={this.exportType}
          browser_id={this.props.browser_id}
        />
        {result_info}
        {paginate}
      </div>
    )
  }
}
