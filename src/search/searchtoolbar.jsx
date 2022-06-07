import eventBus from '../utils/eventbus.js';
import QueryBuilder from './searchqueryeditor.jsx';
import { ExportMenu, ExportConfig } from "../table/export.jsx";
import { MAX_PAGE_ROWS } from "../table/nodestable.jsx";


import React from "react";

import { Input, Button, Pagination } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faColumns, faSearch, faMagic } from '@fortawesome/free-solid-svg-icons';

export default class SearchToolbar extends React.Component 
{
  constructor(props)
  {
    super(props);
    this.state = { currentQuery : "", 
                   currentPage : 1, 
                   result : null, 
                   isQueryBuilderVisible : false,
                   isExportConfigVisible : false,
                 }; 
  }

  componentDidMount()
  {
    eventBus.on("search_result" + this.props.browser_id, this.onResult.bind(this))
  }

  componentWillUnmount() 
  {
    eventBus.dispatch("search_page" + this.props.browser_id); 
  }

  /**
   *  Columns 
   */
  clickColumns = () => {  eventBus.dispatch("search_columns" + this.props.browser_id, "columns") } 

  /**
   *  Pagination
   */
  pageChanged = (page) => 
  { 
    eventBus.dispatch("search_page" + this.props.browser_id, page) 
    this.setState({currentPage : page});
  } 

  onResult(count)
  {
    this.setState({result : count, currentPage : 1});   
  }

  /**
   * Query
   */
  queryInputEnter = (e) => 
  { 
    eventBus.dispatch("search_query" + this.props.browser_id, e.target.value) 
  }

  querySearchClicked = () => 
  { 
    eventBus.dispatch("search_query" + this.props.browser_id, this.state.currentQuery) 
  }

  queryInputChanged(e) 
  {
    this.setState({currentQuery : e.target.value});  
  }

  queryEditClicked = () => 
  {
    this.setState({isQueryBuilderVisible : true});
  }

  queryBuilderOk(values)
  {
    this.setState({ isQueryBuilderVisible : false, currentQuery : values});  
  }

  queryBuilderCancel()
  {
    this.setState({ isQueryBuilderVisible : false}); 
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
      result_info = <div style={{whiteSpace : "nowrap"}}> &nbsp; Found : {this.state.result}</div>
      //result_info = <Button>Found : {this.state.result}</Button>

      if (this.state.result > MAX_PAGE_ROWS)
      {
        paginate =  <Pagination simple current={this.state.currentPage} total={this.state.result} pageSize={MAX_PAGE_ROWS} size={"small"} onChange={this.pageChanged} style={{"marginLeft" : "auto"}} />
      }
    }

    return (
      <div className="toolbar" > 
        <Input value={this.state.currentQuery} onPressEnter={this.queryInputEnter} onChange={this.queryInputChanged.bind(this)} />
        <Button title="Search" icon={<FontAwesomeIcon onClick={this.querySearchClicked} icon={faSearch} />} /> 
        <Button title="Edit query" icon={<FontAwesomeIcon onClick={this.queryEditClicked} icon={faMagic} />} /> 
        &nbsp;&nbsp;&nbsp;&nbsp;
        {/*edit query button ?*/}
        {/*//separator ?*/}
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
        <QueryBuilder browser_id={this.props.browser_id} visible={this.state.isQueryBuilderVisible} onOk={this.queryBuilderOk.bind(this)} onCancel={this.queryBuilderCancel.bind(this)} /> 
      </div>)
  }
}
