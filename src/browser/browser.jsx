import BrowserToolbar from "./browsertoolbar.jsx";
import BrowserTable from "./browsertable.jsx";
import NodeTree from "./nodestree.jsx";
import AttributesTree from "../table/attributestree.jsx";

import React from "react";
import { ReflexContainer, ReflexSplitter, ReflexElement } from 'react-reflex';
import { withSize } from 'react-sizeme';

import 'react-reflex/styles.css';

var browser_id = 0;

class Browser extends React.Component
{
  constructor(props)
  {
    super(props);
    this.browser_id = "bw" + browser_id.toString();
    browser_id += 1;
  }

  render ()
  {
    return (
      <div className="table" style={{height : "100%", width : "100%", overflow : "hidden"}} >
          <BrowserToolbar position='sticky' browser_id={this.browser_id}/>

          <ReflexContainer orientation="vertical" style={{height : this.props.size.height -34, width : "100%"}}>
            <ReflexElement className="left-pane" flex={0.20}>
             <NodeTree size={this.props.size} browser_id={this.browser_id} style={{overflow : "scroll"}}/>
            </ReflexElement>

            <ReflexSplitter />
            <ReflexElement className="middle-pane"  flex={0.6}>
              <BrowserTable browser_id={this.browser_id} size={this.props.size} node_id={this.props.node_id} layout={this.props.layout} onDoubleClick={true} />
            </ReflexElement>

            <ReflexSplitter />
            <ReflexElement className="right-pane">
              <AttributesTree addColumn={true} size={this.props.size} browser_id={this.browser_id} style={{overflow : "scroll"}}/>
            </ReflexElement>
          </ReflexContainer>
      </div>
    );
  }
}

export default withSize({ monitorHeight: true })(Browser);
