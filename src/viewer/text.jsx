import { TapirAPI } from "./../login.js";

import React from "react";
import { Spin } from 'antd';

const MAX_FILE_SIZE = 40*1024*1024;

//XXX use code syntax coloration so we can read code easily
export default class TextViewer  extends React.Component 
{
  constructor(props)
  {
    super(props);
    this.api = TapirAPI();
    this.state = { content : null };
  }

  componentDidMount() 
  {
    this.fetch_text();
  }

  componentDidUpdate(prevProps) 
  {
    if (prevProps.node_id !== this.props.node_id)
    {
      this.fetch_text();
    }
  }

  fetch_text()
  {
    if (this.props.fileSize <= MAX_FILE_SIZE)
    {
      this.get_text().then(text => 
      {
         this.setState({content : text});
      });
    }
  }

  async get_text()
  {
    let response = await this.api.download(this.props.node_id);
    let text = await response.data.text();
    return text;
  }

  render() 
  {
    if (this.props.fileSize > MAX_FILE_SIZE)
    {
      return (<div style={{color : 'white', textAlign : 'center', paddingTop : 100, paddingBottom : 100}}>File is too big to be displayed : {this.props.fileSize}</div>);
    }

    if (this.state.content === null)
    {
      return (
        <div style={{ textAlign : 'center', paddingTop: 100, paddingBottom : 100  }}>
          <Spin tip="Loading"/> 
        </div>
      );
    }
    else
    {
      return (
        <div id="text" style={{whiteSpace : 'pre-wrap'}}>
        {this.state.content}
        </div>
      );
    }
  }
}
