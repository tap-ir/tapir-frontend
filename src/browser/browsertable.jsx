import eventBus from '../utils/eventbus.js';
import NodesTable from '../table/nodestable.jsx';
import { notifyError } from '../utils/notification.jsx';

export default class BrowserTable extends NodesTable 
{
  constructor(props)
  {
    super(props);
  }

  componentDidMount() 
  {
    eventBus.on("toolbarclick" + this.props.browser_id, this.onToolBarClick.bind(this));
    eventBus.on("changedir" + this.props.browser_id, this.changeDirectory.bind(this));
    eventBus.on("changedirbypath" + this.props.browser_id, this.changeDirectoryByPath.bind(this));
    eventBus.on("addColumn" + this.props.browser_id, this.addColumn.bind(this));
    eventBus.on("export" + this.props.browser_id, this.exportSelection.bind(this));
    eventBus.on("pageChanged" + this.props.browser_id, this.onPageChanged.bind(this));

    if (!this.state.data)
    {
      if (!this.props.node_id)
      {
        this.changeDirectoryByPath("/root");
      }
      else
      {
        this.changeDirectory(this.props.node_id);
      }

    }
  }

  componentWillUnmount() 
  {
    eventBus.remove("toolbarclick" + this.props.browser_id);
    eventBus.remove("changedir" + this.props.browser_id);
    eventBus.remove("changedirbypath" + this.props.browser_id);
    eventBus.remove("addColumn" + this.props.browser_id);
    eventBus.remove("export" + this.props.browser_id);
  }

  onPageChanged(page)
  {
    this.setState({currentPage : page});
  }

  changeDirectoryByPath(path)
  {
     this.setState({load : true});
     this.api.children_by_path(path).then(response => 
     {
       if (response)
       {
         let node_id = response[0];
         response[1].then(response =>
         {
           if (response)
           {
             this.setData(response.data);
             this.setState({ current_dir_id : node_id }); 
             eventBus.dispatch("dirchanged" + this.props.browser_id, node_id);
             eventBus.dispatch("paginate" + this.props.browser_id, response.data.length);
           }
         });
       }
     });
     this.setState({load : false});
  }

  changeDirectory(node_id)
  {
     this.setState({load : true});
     this.api.children_by_id(node_id).then(response => 
     {
       if (response)
       {
         this.setData(response.data);
         this.setState({ current_dir_id : node_id, 
                         load : false });

         eventBus.dispatch("dirchanged" + this.props.browser_id, node_id);
         eventBus.dispatch("paginate" + this.props.browser_id, response.data.length);
       }
     }).catch(error => 
     {
       notifyError("Can't connect to server");
       this.setState({ load : false});
     });
  }

  onToolBarClick(data)
  {
    if (data === "home")
    {
      this.changeDirectory({'index1' : 1, 'stamp' : 0});
    }
    else if (data === "back")
    {
      //don't go before root
      if (!(this.state.current_dir_id.index1 === 1 && this.state.current_dir_id.stamp === 0))
      {
        this.api.parent_id(this.state.current_dir_id).then(response =>
        {
          if (response)
          {
            this.changeDirectory(response.data);
          }
        });
      }
    }
    else if (data === "columns")
    {
      this.setState({ isModalVisible : true })
    }
  }
}
