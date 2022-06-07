import TimelineToolbar from "./timelinetoolbar.jsx";
import TimelineTable from "./timelinetable.jsx";
import AttributesTree from "../table/attributestree.jsx";

import React from "react";
import { ReflexContainer, ReflexSplitter, ReflexElement } from 'react-reflex';
import { withSize } from 'react-sizeme';

import 'react-reflex/styles.css';

var timeline_id = 0;

class Timeline extends React.Component
{
  constructor(props, ref_layout)
  {
    super(props);
    this.timeline_id = "tm" + timeline_id.toString();
    timeline_id += 1;
  }

  render ()
  {
    return (
      <div className="table" style={{height : "100%", width : "100%", overflow : "hidden"}} >
          <TimelineToolbar position='sticky' browser_id={this.timeline_id}/>

          <ReflexContainer orientation="vertical" style={{height : this.props.size.height -34, width : "100%"}}>
            <ReflexElement className="left-pane"  flex={0.8}>
              <TimelineTable size={this.props.size} browser_id={this.timeline_id} layout={this.props.layout}/>
            </ReflexElement>

            <ReflexSplitter />
            <ReflexElement className="right-pane">
              <AttributesTree addColumn={true} size={this.props.size} browser_id={this.timeline_id} style={{overflow : "scroll"}}/>
            </ReflexElement>
          </ReflexContainer>
    </div>
    );
  }
}

export default withSize({ monitorHeight: true })(Timeline);
