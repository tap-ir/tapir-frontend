import SearchToolbar from "./searchtoolbar.jsx";
import SearchTable from "./searchtable.jsx";
import AttributesTree from "../table/attributestree.jsx";

import React from "react";
import { ReflexContainer, ReflexSplitter, ReflexElement } from 'react-reflex';
import { withSize } from 'react-sizeme';

import 'react-reflex/styles.css';

var browser_id = 0;

class Search extends React.Component
{
  constructor(props)
  {
    super(props);
    this.browser_id = "sr" + browser_id.toString();
    browser_id += 1;
  }

  render ()
  {
    return (
      <div className="table" style={{height : "100%", width : "100%", overflow : "hidden"}} >
        <SearchToolbar position='sticky' browser_id={this.browser_id}/>

        <ReflexContainer orientation="vertical" style={{height : this.props.size.height -34, width : "100%"}}>
          <ReflexElement className="left-pane"  flex={0.8}>
             <SearchTable browser_id={this.browser_id} size={this.props.size} style={{overflow : "scroll"}} layout={this.props.layout}/>
          </ReflexElement>

          <ReflexSplitter />
          <ReflexElement className="right-pane">
             <AttributesTree addColumn={true} size={this.props.size} browser_id={this.browser_id}  style={{overflow : "scroll"}}/>
          </ReflexElement>
        </ReflexContainer>
      </div>
    );
  }
}

export default withSize({ monitorHeight: true })(Search);
