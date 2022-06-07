import React from "react";
import * as FlexLayout from "flexlayout-react";
import 'flexlayout-react/style/dark.css'

import { AppLayout } from './layout.js';
import Tasks from './task.jsx';
import Plugins from './plugin.jsx';
import Browser from './browser/browser.jsx';
import Timeline from './timeline/timeline.jsx';
import Search from './search/search.jsx';
import Viewer from './viewer/viewer.jsx';
import { createPluginsConfig } from './utils/plugins.jsx';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEye, faCog, faTasks, faClock, faSearch, faFolderOpen, faQuestion, faWindowMaximize, faWindowMinimize } from '@fortawesome/free-solid-svg-icons'

import 'antd/dist/antd.min.css';
import './css/dark.css'; //we overwrite all other here must be the last imported

const ContextExample = React.createContext('');

var  gridIndex: number = 1;
var  api = null;

export function nextGridIndex()
{
  return gridIndex++;
}

class Frontend extends React.Component
{
    //nextGridIndex: number = 1;
    constructor(props) 
    {
    	super(props);
      createPluginsConfig();
      this.state = {model: FlexLayout.Model.fromJson(AppLayout), adding: false, fontSize: "medium", fullScreen : false };
      //XXX save layout
    }

    preventIOSScrollingWhenDragging(e: Event) {
        if (FlexLayout.DragDrop.instance.isActive()) {
            e.preventDefault();
        }
    }

    componentDidMount() {
        //this.loadLayout("default", false);
        document.body.addEventListener("touchmove", this.preventIOSScrollingWhenDragging, { passive: false });
    }

   iconFactory = (node: TabNode) => 
   {
     let component = node.getComponent()
     if (component === "browser") {
       return <><FontAwesomeIcon icon={faFolderOpen} /></>
     }
     else if (component === "search") {
       return <><FontAwesomeIcon icon={faSearch} /></>
     }
     else if (component === "timeline") {
       return <><FontAwesomeIcon icon={faClock}/></>
     }
     else if (component === "tasks") {
       return <><FontAwesomeIcon icon={faTasks}/></>
     }
     else if (component === "plugins") {
       return <><FontAwesomeIcon icon={faCog}/></>
     }
     else if (component === "multitype") {
       return <><FontAwesomeIcon icon={faQuestion} /></>
     }
     else if (component === "viewer") { 
       return <><FontAwesomeIcon icon={faEye} /></>
     }
     return;
    }

    factory(node) 
    {
      var component = node.getComponent();
      if (component === "text") {
         return (<div className="panel">Panel {node.getName()}</div>);
      }
      else if (component === "plugins")
      {
        return <Plugins />;
      }
      else if (component === "tasks")
      {
        return <Tasks layout={this.refs}/>;
      }
      else if (component === "browser")
      {
        const config = node.getConfig();
        if (config && config.node_id)
          return <Browser layout={this.refs} node_id={config.node_id} />;
        else
          return <Browser layout={this.refs} />;
      }
      else if (component === "timeline")
      {
        //    return (<div className="panel">Panel {node.getName()}</div>);
        return <Timeline layout={this.refs} />;
      }
      else if (component === "search")
      {
        return <Search layout={this.refs} />;
      }
      else if (component === "viewer")
      {
        const config = node.getConfig();
        if (config)
          return <Viewer layout={this.refs} config={config} />
        else
          return <Viewer layout={this.refs} />;
      }
      else if (component === "multitype") //use to display doc online or html generated ?
      {
        try 
        {
          const config = node.getConfig();
          if (config.type === "url") 
          {
            return <iframe title={node.getId()} src={config.data} style={{ display: "block", border: "none", boxSizing: "border-box" }} width="100%" height="100%" />;
          } 
          else if (config.type === "html") 
          {
            return (<div dangerouslySetInnerHTML={{ __html: config.data }} />);
          }
          else if (config.type === "text") 
          {
            return (
             <textarea style={{ position: "absolute", width: "100%", height: "100%", resize: "none", boxSizing: "border-box", border: "none" }}
             defaultValue={config.data}
             />);
          }
        } 
        catch (e) 
        {
          return (<div>{String(e)}</div>);
        }
      }
    }

    onAddBrowserClick = (event: React.MouseEvent) => {
        if (this.state.model.getMaximizedTabset() == null) {
            this.refs.layout.addTabToActiveTabSet({
                component: "browser",
                name: "Browser " + nextGridIndex()
            });
        }
    }

    onAddSearchClick = (event: React.MouseEvent) => {
        if (this.state.model.getMaximizedTabset() == null) {
            this.refs.layout.addTabToActiveTabSet({
                component: "search",
                name: "Search " + nextGridIndex()
            });
        }
    }

    onAddTimelineClick = (event: React.MouseEvent) => {
        if (this.state.model.getMaximizedTabset() == null) {
            this.refs.layout.addTabToActiveTabSet({
                component: "timeline",
                name: "Timeline " + nextGridIndex()
            });
        }
    }

    onAddTaskClick = (event: React.MouseEvent) => {
        if (this.state.model.getMaximizedTabset() == null) {
            this.refs.layout.addTabToActiveTabSet({
                component: "tasks",
                name: "Tasks " + nextGridIndex()
            });
        }
    }

    onAddPluginsClick = (event: React.MouseEvent) => {
        if (this.state.model.getMaximizedTabset() == null) {
            this.refs.layout.addTabToActiveTabSet({
                component: "plugins",
                name: "Plugins " + nextGridIndex()
            });
        }
    }

    onAddHelpClick = (event: React.MouseEvent) => {
        if (this.state.model.getMaximizedTabset() == null) {
            this.refs.layout.addTabToActiveTabSet({
                component: "multitype",
              	config: {
                          "type":"url",
              			  		"data": "https://tap-ir.github.io/"
					            	},
                name: "Help " + nextGridIndex()
            });
        }
    }

    onTableClick = (node: Node, event: Event) => {
    }

    onFullScreen = (event) =>
    {
      if (!document.fullscreenElement) 
      {
        document.documentElement.requestFullscreen();
        this.setState({ fullScreen : true});
      } 
      else 
      {
        if (document.exitFullscreen) 
        {
          document.exitFullscreen();
          this.setState({fullScreen : false});
        }
      }
    }

    onSizeChange = (event) => 
    {
      var target = event.target;
      this.setState({ fontSize: target.value });
    }

    onThemeChange = (event) => 
    {
      //var target = event.target;
      //let flexlayout_stylesheet: any = document.getElementById("frontend-dark");
      //let index = flexlayout_stylesheet.href.lastIndexOf("/");
      //let newAddress = flexlayout_stylesheet.href.substr(0, index);
      //flexlayout_stylesheet.setAttribute("href", newAddress + "/" + target.value + ".css");
      //let page_stylesheet = window.document.getElementById("page-stylesheet");
      //page_stylesheet.setAttribute("href", target.value + ".css");
      //this.forceUpdate();
    }

    render() 
    {
        let contents: React.ReactNode = "loading ...";
        let maximized = false;
        if (this.state.model !== null) 
        {
          maximized = this.state.model.getMaximizedTabset() !== undefined;
          contents = <FlexLayout.Layout
                ref="layout"
                model={this.state.model}
                font={{ size: this.state.fontSize }}
                //titleFactory={this.titleFactory}
                titleFactory={this.titleFactory}
                iconFactory={this.iconFactory}
                factory={this.factory.bind(this)}/>
        }

        let fullscreenIcon = faWindowMaximize;
        if (document.fullscreenElement || !this.state.fullScreen) 
        {
          fullscreenIcon = faWindowMaximize;
        }
        else
        {
          fullscreenIcon = faWindowMinimize;
        }

        return (
         <ContextExample.Provider value="from context">
         <div className="app">
            <div className="toolbar" dir="ltr">
                {/*<button className="toolbar_control" disabled={this.state.adding || maximized} style={{ marginLeft: 5 }} title="Add browser" onClick={this.onAddBrowserClick}>Browser</button>*/}
                <button className="toolbar_control" disabled={this.state.adding || maximized} style={{ marginLeft: 5 }} title="Add browser" onClick={this.onAddBrowserClick}><FontAwesomeIcon icon={faFolderOpen} /> Browser</button>
                <button className="toolbar_control" disabled={this.state.adding || maximized} style={{ marginLeft: 5 }} title="Add search" onClick={this.onAddSearchClick}><FontAwesomeIcon icon={faSearch} /> Search</button>
                <button className="toolbar_control" disabled={this.state.adding || maximized} style={{ marginLeft: 5 }} title="Add timeline" onClick={this.onAddTimelineClick}><FontAwesomeIcon icon={faClock} /> Timeline</button>

                <button className="toolbar_control" disabled={this.state.adding || maximized} style={{ marginLeft: 5 }} title="Add task" onClick={this.onAddTaskClick}><FontAwesomeIcon icon={faTasks} /> Task</button>
                <button className="toolbar_control" disabled={this.state.adding || maximized} style={{ marginLeft: 5 }} title="Add plugins" onClick={this.onAddPluginsClick}><FontAwesomeIcon icon={faCog} /> Plugins</button>

                <div style={{ flexGrow: 1 }}></div>
                {/*<select  className="toolbar_control" style={{ marginLeft: 5 }}
                    onChange={this.onSizeChange}
                    defaultValue="medium">
                    <option value="xx-small">Size xx-small</option>
                    <option value="x-small">Size x-small</option>
                    <option value="small">Size small</option>
                    <option value="medium">Size medium</option>
                    <option value="large">Size large</option>
                </select>
*/}
                {/*<select  className="toolbar_control" style={{ marginLeft: 5 }} defaultValue="dark" onChange={this.onThemeChange}>
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                    <option value="matrix">Matrix</option>
                </select>*/}
                <button className="toolbar_control" style={{ marginLeft: 5 }} title="Fullscreen (F11/Esc)" onClick={this.onFullScreen}><FontAwesomeIcon icon={fullscreenIcon} /> Fullscreen</button>
                <button className="toolbar_control" disabled={this.state.adding || maximized} style={{ marginLeft: 5 }} title="Help" onClick={this.onAddHelpClick}><FontAwesomeIcon icon={faQuestion} /> Help</button>
            </div>

            <div className="contents">
                {contents}
            </div>
            {/*<FlexLayout.Layout
                model={this.state.model}
                factory={this.factory.bind(this)}/>*/}
          </div>
        </ContextExample.Provider>
        );
    }
}

export default Frontend;
